import {
    Injectable,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ConversationsService } from '../conversations/conversations.service';
import { AgentsService } from '../agents/agents.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { AiService } from '../ai/ai.service';
import { CustomersService } from '../customers/customers.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CompaniesService } from '../companies/companies.service';
import { Company } from '../companies/entities/company.entity';
import { ConversationStatus } from '../conversations/entities/conversation.entity';
import { MessageSender } from '../conversations/entities/message.entity';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);
    private readonly graphApiUrl = 'https://graph.facebook.com/v19.0';

    constructor(
        private readonly configService: ConfigService,
        private readonly conversationsService: ConversationsService,
        private readonly agentsService: AgentsService,
        private readonly kbService: KnowledgeBaseService,
        private readonly aiService: AiService,
        private readonly customersService: CustomersService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly companiesService: CompaniesService,
    ) { }

    verifyWebhook(mode: string, token: string, challenge: string): string {
        const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');
        if (mode === 'subscribe' && token === verifyToken) {
            return challenge;
        }
        throw new BadRequestException('Vérification du webhook échouée');
    }

    async handleIncomingMessage(body: any): Promise<void> {
        const entry = body?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value?.messages) return;

        const phoneNumberId = value.metadata?.phone_number_id;
        const message = value.messages[0];

        if (message.type !== 'text') return;

        const customerPhone = message.from;
        const customerMessage = message.text.body;
        const waMessageId = message.id;

        // Trouver la company via le phoneNumberId configuré
        const company = await this.findCompanyByPhoneNumberId(phoneNumberId);
        if (!company) {
            this.logger.warn(`Aucune entreprise trouvée pour phoneNumberId: ${phoneNumberId}`);
            return;
        }

        // Trouver ou créer le customer
        const customer = await this.customersService.findOrCreateByWaId(
            customerPhone,
            company.id,
            customerPhone,
        );

        // Trouver l'agent actif de la company (premier agent actif)
        const agents = await this.agentsService.findAllByCompany(company.id);
        const agent = agents.find((a) => a.isActive);
        if (!agent) {
            this.logger.warn(`Aucun agent actif pour la company: ${company.id}`);
            return;
        }

        // Trouver ou créer la conversation
        const waConvId = `${customerPhone}_${company.id}`;
        const conversation = await this.conversationsService.findOrCreate(
            company.id,
            agent.id,
            customer.id,
            waConvId,
        );

        // Si conversation en mode humain, ne pas répondre par IA
        if (conversation.status === ConversationStatus.HUMAN_ACTIVE) {
            await this.conversationsService.addMessage(
                conversation.id,
                customerMessage,
                MessageSender.CUSTOMER,
                waMessageId,
            );
            return;
        }

        // Enregistrer le message client
        await this.conversationsService.addMessage(
            conversation.id,
            customerMessage,
            MessageSender.CUSTOMER,
            waMessageId,
        );

        // Récupérer l'historique
        const messages = await this.conversationsService.getMessages(conversation.id, company.id);

        // Base de connaissances
        const knowledge = await this.kbService.getFormattedKnowledge(agent.id, company.id);

        // Contexte entreprise
        const companyContext = `
Nom: ${company.name}
Secteur: ${company.sector ?? 'Non précisé'}
Ville: ${company.city ?? 'Non précisée'}
Description: ${company.description ?? 'Non précisée'}
Téléphone: ${company.phone ?? 'Non précisé'}
`;

        // Générer réponse IA
        let aiResponse: string;
        try {
            aiResponse = await this.aiService.generateReply(
                agent,
                companyContext,
                knowledge,
                messages,
                customerMessage,
            );
        } catch (err) {
            this.logger.error('Erreur OpenAI', err);
            aiResponse = "Je suis momentanément indisponible. Veuillez réessayer dans quelques instants.";
        }

        // Gérer le handoff
        if (aiResponse.includes('HANDOFF_REQUIRED')) {
            aiResponse = aiResponse.replace('HANDOFF_REQUIRED', '').trim() ||
                "Je vais vous mettre en relation avec un conseiller. Merci de patienter.";
            await this.conversationsService.updateStatus(
                conversation.id,
                company.id,
                ConversationStatus.HUMAN_REQUESTED,
            );
        }

        // Enregistrer la réponse IA
        await this.conversationsService.addMessage(
            conversation.id,
            aiResponse,
            MessageSender.AI,
        );

        // Incrémenter l'usage
        await this.subscriptionsService.incrementUsage(company.id);

        // Envoyer la réponse WhatsApp
        try {
            await this.sendMessage(phoneNumberId, customerPhone, aiResponse);
        } catch (err: any) {
            const metaError = err?.response?.data ?? err?.message;
            this.logger.error(`Erreur envoi WhatsApp [${err?.response?.status}]: ${JSON.stringify(metaError)}`);
        }
    }

    private async sendMessage(phoneNumberId: string, to: string, text: string): Promise<void> {
        const token = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
        this.logger.log(`Envoi WhatsApp → ${to} via phoneNumberId: ${phoneNumberId}, token: ${token?.slice(0, 20)}...`);
        await axios.post(
            `${this.graphApiUrl}/${phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'text',
                text: { preview_url: false, body: text },
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            },
        );
    }

    private async findCompanyByPhoneNumberId(phoneNumberId: string): Promise<Company | null> {
        // Le phoneNumberId est stocké dans company via un champ dédié
        // Pour simplifier le MVP, on retourne la première company ayant ce numéro configuré
        return this.companiesService.findByPhoneNumberId(phoneNumberId);
    }
}
