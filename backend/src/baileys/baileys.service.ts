import {
    Injectable,
    Logger,
    OnModuleInit,
    OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { BaileysSession } from './entities/baileys-session.entity';
import { ConversationsService } from '../conversations/conversations.service';
import { AgentsService } from '../agents/agents.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { AiService } from '../ai/ai.service';
import { CustomersService } from '../customers/customers.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CompaniesService } from '../companies/companies.service';
import { ConversationStatus } from '../conversations/entities/conversation.entity';
import { MessageSender } from '../conversations/entities/message.entity';

// Logger silencieux pour Baileys (évite le bruit de pino)
const silentLogger = {
    level: 'silent',
    trace: () => { },
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    fatal: () => { },
    child: function () { return silentLogger; },
} as any;

@Injectable()
export class BaileysService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BaileysService.name);
    // companyId → socket Baileys
    private sessions = new Map<string, any>();
    // companyId → QR code base64 courant
    private qrCodes = new Map<string, string>();

    constructor(
        @InjectRepository(BaileysSession)
        private readonly sessionRepo: Repository<BaileysSession>,
        private readonly conversationsService: ConversationsService,
        private readonly agentsService: AgentsService,
        private readonly kbService: KnowledgeBaseService,
        private readonly aiService: AiService,
        private readonly customersService: CustomersService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly companiesService: CompaniesService,
    ) { }

    async onModuleInit() {
        const activeSessions = await this.sessionRepo.find({ where: { status: 'connected' } });
        for (const session of activeSessions) {
            this.logger.log(`Restauration session Baileys — company ${session.companyId}`);
            this.startSession(session.companyId).catch((err) =>
                this.logger.error(`Échec restauration session ${session.companyId}`, err),
            );
        }
    }

    onModuleDestroy() {
        for (const [, socket] of this.sessions) {
            try { socket.end(undefined); } catch { }
        }
        this.sessions.clear();
    }

    hasActiveSession(companyId: string): boolean {
        const socket = this.sessions.get(companyId);
        return !!socket?.user;
    }

    async getStatus(companyId: string): Promise<{
        status: string;
        qr?: string;
        phoneNumber?: string;
        displayName?: string;
    }> {
        const record = await this.sessionRepo.findOne({ where: { companyId } });
        if (!record) return { status: 'not_started' };
        return {
            status: record.status,
            qr: this.qrCodes.get(companyId),
            phoneNumber: record.phoneNumber ?? undefined,
            displayName: record.displayName ?? undefined,
        };
    }

    async startSession(companyId: string): Promise<void> {
        // Fermer la session existante si présente
        if (this.sessions.has(companyId)) {
            try { this.sessions.get(companyId)!.end(undefined); } catch { }
            this.sessions.delete(companyId);
        }
        this.qrCodes.delete(companyId);

        // Import dynamique pour compatibilité CJS/ESM
        const baileys = await import('@whiskeysockets/baileys');
        const makeWASocket = (baileys as any).default ?? baileys;
        const {
            DisconnectReason,
            fetchLatestBaileysVersion,
            initAuthCreds,
            BufferJSON,
            proto,
        } = baileys as any;

        const authState = await this.buildAuthState(companyId, initAuthCreds, BufferJSON, proto);
        const { version } = await fetchLatestBaileysVersion();

        const socket = makeWASocket({
            version,
            auth: authState.state,
            printQRInTerminal: false,
            logger: silentLogger,
            browser: ['Ivoire Agents', 'Chrome', '120.0.0'],
            syncFullHistory: false,
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: false,
        });

        this.sessions.set(companyId, socket);
        socket.ev.on('creds.update', authState.saveCreds);

        socket.ev.on('connection.update', async (update: any) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                try {
                    const qrImage = await QRCode.toDataURL(qr);
                    this.qrCodes.set(companyId, qrImage);
                    await this.upsertRecord(companyId, { status: 'qr_pending', lastQr: qrImage });
                } catch (err) {
                    this.logger.error('Erreur génération QR', err);
                }
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                const loggedOut = statusCode === (DisconnectReason?.loggedOut ?? 401);
                this.logger.log(`Connexion fermée company=${companyId} code=${statusCode} loggedOut=${loggedOut}`);

                if (!loggedOut) {
                    setTimeout(() => this.startSession(companyId).catch(() => { }), 4000);
                } else {
                    await this.upsertRecord(companyId, {
                        status: 'disconnected', creds: null, keys: {},
                        phoneNumber: undefined, displayName: undefined, lastQr: undefined,
                    });
                    await this.companiesService.update(companyId, { whatsappConnected: false });
                    this.sessions.delete(companyId);
                    this.qrCodes.delete(companyId);
                }
            }

            if (connection === 'open') {
                this.qrCodes.delete(companyId);
                const rawId: string = socket.user?.id ?? '';
                const phoneNumber = rawId.split(':')[0].split('@')[0] || null;
                const displayName = socket.user?.name ?? null;
                this.logger.log(`Baileys connecté company=${companyId} numéro=${phoneNumber}`);
                await this.upsertRecord(companyId, {
                    status: 'connected', phoneNumber: phoneNumber ?? undefined, displayName: displayName ?? undefined, lastQr: undefined,
                });
                await this.companiesService.update(companyId, { whatsappConnected: true });
            }
        });

        socket.ev.on('messages.upsert', async ({ messages, type }: any) => {
            if (type !== 'notify') return;
            for (const msg of messages) {
                await this.handleIncomingMessage(companyId, msg).catch((err) =>
                    this.logger.error(`Erreur traitement message Baileys`, err),
                );
            }
        });
    }

    async sendMessage(companyId: string, to: string, text: string): Promise<void> {
        const socket = this.sessions.get(companyId);
        if (!socket) throw new Error(`Pas de session Baileys active pour ${companyId}`);
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        await socket.sendMessage(jid, { text });
    }

    async disconnect(companyId: string): Promise<void> {
        const socket = this.sessions.get(companyId);
        if (socket) {
            try { await socket.logout(); } catch { try { socket.end(undefined); } catch { } }
            this.sessions.delete(companyId);
        }
        this.qrCodes.delete(companyId);
        await this.upsertRecord(companyId, {
            status: 'disconnected', creds: null, keys: {},
            phoneNumber: undefined, displayName: undefined, lastQr: undefined,
        });
        await this.companiesService.update(companyId, { whatsappConnected: false });
    }

    // ─── Traitement des messages entrants ────────────────────────────────────

    private async handleIncomingMessage(companyId: string, msg: any): Promise<void> {
        if (msg.key.fromMe) return;
        if (msg.key.remoteJid?.endsWith('@g.us')) return;
        if (msg.key.remoteJid === 'status@broadcast') return;

        const customerPhone = msg.key.remoteJid?.split('@')[0] ?? '';
        if (!customerPhone) return;

        const waMessageId = msg.key.id ?? '';
        const customerMessage =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption || '';

        if (!customerMessage) return;

        const company = await this.companiesService.findById(companyId);
        if (!company) return;

        const customer = await this.customersService.findOrCreateByWaId(customerPhone, companyId, customerPhone);

        const agents = await this.agentsService.findAllByCompany(companyId);
        const agent = agents.find((a) => a.isActive);
        if (!agent) {
            this.logger.warn(`Aucun agent actif pour company ${companyId}`);
            return;
        }

        const waConvId = `${customerPhone}_${companyId}`;
        const conversation = await this.conversationsService.findOrCreate(companyId, agent.id, customer.id, waConvId);

        if (conversation.status === ConversationStatus.HUMAN_ACTIVE) {
            await this.conversationsService.addMessage(conversation.id, customerMessage, MessageSender.CUSTOMER, waMessageId);
            return;
        }

        await this.conversationsService.addMessage(conversation.id, customerMessage, MessageSender.CUSTOMER, waMessageId);

        const messages = await this.conversationsService.getMessages(conversation.id, companyId);
        const knowledge = await this.kbService.getFormattedKnowledge(agent.id, companyId);
        const companyContext = `Nom: ${company.name}\nSecteur: ${company.sector ?? 'Non précisé'}\nVille: ${company.city ?? 'Non précisée'}\nDescription: ${company.description ?? 'Non précisée'}\nTéléphone: ${company.phone ?? 'Non précisé'}`;

        let aiResponse = '';
        let tokensUsed = 0;
        try {
            const result = await this.aiService.generateReply(agent, companyContext, knowledge, messages, customerMessage);
            aiResponse = result.text;
            tokensUsed = result.totalTokens;
        } catch {
            aiResponse = 'Je suis momentanément indisponible. Veuillez réessayer dans quelques instants.';
        }

        if (aiResponse.includes('HANDOFF_REQUIRED')) {
            aiResponse = aiResponse.replace('HANDOFF_REQUIRED', '').trim() ||
                'Je vais vous mettre en relation avec un conseiller. Merci de patienter.';
            await this.conversationsService.updateStatus(conversation.id, companyId, ConversationStatus.HUMAN_REQUESTED);
            this.conversationsService.recordGap(customerMessage, companyId, agent.id).catch(() => { });
        }

        const recentContext = messages.slice(-5).map((m) => `${m.sender}: ${m.content}`).join(' | ');
        this.aiService.calculateLeadScore(customerMessage, recentContext)
            .then((score) => this.conversationsService.updateLeadScore(conversation.id, companyId, score))
            .catch(() => { });

        await this.conversationsService.addMessage(conversation.id, aiResponse, MessageSender.AI);
        await this.subscriptionsService.incrementUsage(companyId, tokensUsed);

        try {
            await this.sendMessage(companyId, customerPhone, aiResponse);
        } catch (err: any) {
            this.logger.error(`Erreur envoi Baileys pour ${companyId}`, err.message);
        }
    }

    // ─── Auth state PostgreSQL ────────────────────────────────────────────────

    private async buildAuthState(companyId: string, initAuthCreds: any, BufferJSON: any, proto: any) {
        await this.upsertRecord(companyId, {});

        const record = await this.sessionRepo.findOne({ where: { companyId } });
        const creds = record?.creds
            ? JSON.parse(JSON.stringify(record.creds), BufferJSON.reviver)
            : initAuthCreds();

        const repo = this.sessionRepo;
        const keys = {
            async get(type: string, ids: string[]) {
                const fresh = await repo.findOne({ where: { companyId }, select: ['keys'] });
                const store: any = fresh?.keys ?? {};
                const result: Record<string, any> = {};
                for (const id of ids) {
                    const val = store[type]?.[id];
                    if (val !== undefined) {
                        result[id] = type === 'app-state-sync-key' && proto
                            ? proto.Message.AppStateSyncKeyData.fromObject(val)
                            : JSON.parse(JSON.stringify(val), BufferJSON.reviver);
                    }
                }
                return result;
            },
            async set(data: Record<string, any>) {
                const fresh = await repo.findOne({ where: { companyId }, select: ['keys'] });
                const store: Record<string, any> = { ...(fresh?.keys ?? {}) };
                for (const [type, entries] of Object.entries(data)) {
                    if (!store[type]) store[type] = {};
                    for (const [id, val] of Object.entries(entries as Record<string, any>)) {
                        if (val == null) delete store[type][id];
                        else store[type][id] = JSON.parse(JSON.stringify(val, BufferJSON.replacer));
                    }
                    if (!Object.keys(store[type]).length) delete store[type];
                }
                await repo.update({ companyId }, { keys: store });
            },
            transaction: async (work: () => Promise<void>) => { await work(); },
        };

        const state = { creds, keys };
        return {
            state,
            saveCreds: async () => {
                await repo.update(
                    { companyId },
                    { creds: JSON.parse(JSON.stringify(state.creds, BufferJSON.replacer)) },
                );
            },
        };
    }

    private async upsertRecord(companyId: string, data: Partial<BaileysSession>) {
        const existing = await this.sessionRepo.findOne({ where: { companyId } });
        if (existing) {
            if (Object.keys(data).length) {
                await this.sessionRepo.update({ companyId }, data);
            }
        } else {
            await this.sessionRepo.save(
                this.sessionRepo.create({ companyId, keys: {}, status: 'disconnected', ...data }),
            );
        }
    }
}
