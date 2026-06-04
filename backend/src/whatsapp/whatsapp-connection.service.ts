import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import axios from 'axios';
import { WhatsappConnection } from './entities/whatsapp-connection.entity';
import { CompaniesService } from '../companies/companies.service';

const ALGORITHM = 'aes-256-gcm';

export interface EmbeddedSignupDto {
    accessToken: string;
    wabaId: string;
    phoneNumberId?: string;
    metaBusinessId?: string;
}

export interface SafeConnectionStatus {
    connected: boolean;
    displayPhoneNumber?: string;
    qualityRating?: string;
    connectionStatus?: string;
    webhookStatus?: string;
    tokenExpiresAt?: Date;
}

@Injectable()
export class WhatsappConnectionService {
    private readonly logger = new Logger(WhatsappConnectionService.name);
    private readonly graphApiUrl = 'https://graph.facebook.com/v19.0';

    constructor(
        @InjectRepository(WhatsappConnection)
        private readonly connectionRepo: Repository<WhatsappConnection>,
        private readonly configService: ConfigService,
        private readonly companiesService: CompaniesService,
    ) { }

    // ─── Chiffrement AES-256-GCM ─────────────────────────────────────────────

    encryptToken(text: string): string {
        const keyHex = this.configService.get<string>('ENCRYPTION_KEY', '');
        if (!keyHex || keyHex.length < 64) {
            throw new BadRequestException('ENCRYPTION_KEY manquante ou insuffisante (min 64 hex chars)');
        }
        const key = Buffer.from(keyHex.slice(0, 64), 'hex');
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([iv, tag, encrypted]).toString('hex');
    }

    decryptToken(encryptedHex: string): string {
        const keyHex = this.configService.get<string>('ENCRYPTION_KEY', '');
        if (!keyHex || keyHex.length < 64) {
            throw new BadRequestException('ENCRYPTION_KEY manquante ou insuffisante');
        }
        const key = Buffer.from(keyHex.slice(0, 64), 'hex');
        const data = Buffer.from(encryptedHex, 'hex');
        const iv = data.subarray(0, 12);
        const tag = data.subarray(12, 28);
        const encrypted = data.subarray(28);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
    }

    // ─── API Meta ─────────────────────────────────────────────────────────────

    /** Échange un token court terme contre un token long terme (60 jours) */
    private async exchangeForLongLivedToken(shortToken: string): Promise<{ token: string; expiresAt: Date | null }> {
        const appId = this.configService.get<string>('META_APP_ID');
        const appSecret = this.configService.get<string>('META_APP_SECRET');
        if (!appId || !appSecret) {
            this.logger.warn('META_APP_ID ou META_APP_SECRET absent — token court terme utilisé');
            return { token: shortToken, expiresAt: null };
        }
        try {
            const res = await axios.get(`${this.graphApiUrl}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: appId,
                    client_secret: appSecret,
                    fb_exchange_token: shortToken,
                },
            });
            const expiresIn: number = res.data.expires_in ?? 0;
            const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null;
            return { token: res.data.access_token, expiresAt };
        } catch (err: any) {
            this.logger.error('Erreur échange token Meta', err?.response?.data);
            return { token: shortToken, expiresAt: null };
        }
    }

    /** Récupère les numéros de téléphone d'un WABA */
    async getPhoneNumbers(accessToken: string, wabaId: string): Promise<any[]> {
        const res = await axios.get(`${this.graphApiUrl}/${wabaId}/phone_numbers`, {
            params: { fields: 'id,display_phone_number,verified_name,quality_rating' },
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.data?.data ?? [];
    }

    /** Abonne l'app aux webhooks du WABA */
    private async subscribeAppToWaba(accessToken: string, wabaId: string): Promise<void> {
        try {
            await axios.post(
                `${this.graphApiUrl}/${wabaId}/subscribed_apps`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } },
            );
            this.logger.log(`App abonnée aux webhooks WABA: ${wabaId}`);
        } catch (err: any) {
            this.logger.error('Erreur abonnement webhooks WABA', err?.response?.data);
        }
    }

    // ─── Gestion connexion ────────────────────────────────────────────────────

    async processEmbeddedSignup(companyId: string, dto: EmbeddedSignupDto): Promise<SafeConnectionStatus> {
        const { accessToken: shortToken, wabaId, phoneNumberId: providedPhoneNumberId, metaBusinessId } = dto;

        // 1. Échanger contre un token long terme
        const { token: longToken, expiresAt } = await this.exchangeForLongLivedToken(shortToken);

        // 2. Récupérer les numéros du WABA
        let phoneNumbers: any[];
        try {
            phoneNumbers = await this.getPhoneNumbers(longToken, wabaId);
        } catch (err: any) {
            throw new BadRequestException(`Impossible d'accéder aux numéros du WABA: ${err?.response?.data?.error?.message ?? err.message}`);
        }

        if (!phoneNumbers.length) {
            throw new BadRequestException('Aucun numéro de téléphone WhatsApp trouvé pour ce compte');
        }

        // 3. Sélectionner le numéro fourni ou le premier disponible
        let selectedPhone: any;
        if (providedPhoneNumberId) {
            selectedPhone = phoneNumbers.find((p) => p.id === providedPhoneNumberId) ?? phoneNumbers[0];
        } else {
            selectedPhone = phoneNumbers[0];
        }

        const phoneNumberId = selectedPhone.id;
        const displayPhoneNumber = selectedPhone.display_phone_number;
        const qualityRating = selectedPhone.quality_rating ?? 'GREEN';

        // 4. Abonner l'app aux webhooks du WABA
        await this.subscribeAppToWaba(longToken, wabaId);

        // 5. Chiffrer le token
        const accessTokenEncrypted = this.encryptToken(longToken);

        // 6. Générer un verify token unique pour ce compte
        const webhookVerifyToken = crypto.randomUUID();

        // 7. Upsert la connexion
        const existing = await this.connectionRepo.findOne({ where: { companyId } });
        const connection = this.connectionRepo.create({
            ...(existing ?? {}),
            companyId,
            provider: 'meta',
            metaBusinessId: metaBusinessId ?? existing?.metaBusinessId,
            wabaId,
            phoneNumberId,
            displayPhoneNumber,
            accessTokenEncrypted,
            tokenExpiresAt: expiresAt ?? undefined,
            webhookVerifyToken,
            webhookStatus: 'pending',
            qualityRating,
            connectionStatus: 'active',
        });
        await this.connectionRepo.save(connection);

        // 8. Mettre à jour la company
        await this.companiesService.update(companyId, {
            whatsappConnected: true,
            whatsappPhoneNumberId: phoneNumberId,
        });

        this.logger.log(`Connexion WhatsApp créée pour company ${companyId} — numéro: ${displayPhoneNumber}`);

        return this.getStatus(companyId);
    }

    async getStatus(companyId: string): Promise<SafeConnectionStatus> {
        const conn = await this.connectionRepo.findOne({ where: { companyId } });
        if (!conn || conn.connectionStatus === 'disconnected') {
            return { connected: false };
        }
        return {
            connected: true,
            displayPhoneNumber: conn.displayPhoneNumber,
            qualityRating: conn.qualityRating,
            connectionStatus: conn.connectionStatus,
            webhookStatus: conn.webhookStatus,
            tokenExpiresAt: conn.tokenExpiresAt,
        };
    }

    async disconnect(companyId: string): Promise<void> {
        const conn = await this.connectionRepo.findOne({ where: { companyId } });
        if (conn) {
            conn.connectionStatus = 'disconnected';
            await this.connectionRepo.save(conn);
        }
        await this.companiesService.update(companyId, {
            whatsappConnected: false,
        });
    }

    /** Retourne la connexion active (avec token chiffré) — usage interne uniquement */
    async getActiveConnection(companyId: string): Promise<WhatsappConnection | null> {
        return this.connectionRepo.findOne({
            where: { companyId, connectionStatus: 'active' },
        });
    }

    /** Recherche la company par phoneNumberId dans la table des connexions */
    async findCompanyIdByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
        const conn = await this.connectionRepo.findOne({
            where: { phoneNumberId, connectionStatus: 'active' },
            select: ['companyId'],
        });
        return conn?.companyId ?? null;
    }

    /** Marque le webhook comme vérifié */
    async markWebhookVerified(companyId: string): Promise<void> {
        await this.connectionRepo.update({ companyId }, { webhookStatus: 'verified' });
    }
}
