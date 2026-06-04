import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Conversation, ConversationStatus } from './entities/conversation.entity';
import { Message, MessageSender } from './entities/message.entity';
import { KbGap } from '../knowledge-base/entities/kb-gap.entity';
import { MessageFeedback, FeedbackType } from './entities/message-feedback.entity';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private readonly convRepository: Repository<Conversation>,
        @InjectRepository(Message)
        private readonly msgRepository: Repository<Message>,
        @InjectRepository(KbGap)
        private readonly kbGapRepository: Repository<KbGap>,
        @InjectRepository(MessageFeedback)
        private readonly feedbackRepository: Repository<MessageFeedback>,
    ) { }

    async findOrCreate(
        companyId: string,
        agentId: string,
        customerId: string,
        waConversationId?: string,
    ): Promise<Conversation> {
        if (waConversationId) {
            const existing = await this.convRepository.findOne({
                where: { waConversationId, companyId },
            });
            if (existing) return existing;
        }

        const conv = this.convRepository.create({
            companyId,
            agentId,
            customerId,
            waConversationId,
            status: ConversationStatus.AI_ACTIVE,
        });
        return this.convRepository.save(conv);
    }

    async findAllByCompany(companyId: string, page = 1, limit = 20): Promise<{ data: Conversation[]; total: number }> {
        const [data, total] = await this.convRepository.findAndCount({
            where: { companyId },
            order: { updatedAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['customer'],
        });
        return { data, total };
    }

    async findOne(id: string, companyId: string): Promise<Conversation> {
        const conv = await this.convRepository.findOne({
            where: { id, companyId },
            relations: ['messages', 'customer'],
        });
        if (!conv) throw new NotFoundException('Conversation introuvable');
        return conv;
    }

    async addMessage(
        conversationId: string,
        content: string,
        sender: MessageSender,
        waMessageId?: string,
    ): Promise<Message> {
        const msg = this.msgRepository.create({
            conversationId,
            content,
            sender,
            waMessageId,
        });
        return this.msgRepository.save(msg);
    }

    async updateStatus(id: string, companyId: string, status: ConversationStatus): Promise<Conversation> {
        const conv = await this.findOne(id, companyId);
        conv.status = status;
        if (status === ConversationStatus.CLOSED) {
            conv.closedAt = new Date();
        }
        return this.convRepository.save(conv);
    }

    async addNote(id: string, companyId: string, note: string): Promise<Conversation> {
        const conv = await this.findOne(id, companyId);
        conv.internalNote = note;
        return this.convRepository.save(conv);
    }

    async getMessages(conversationId: string, companyId: string): Promise<Message[]> {
        await this.findOne(conversationId, companyId);
        return this.msgRepository.find({
            where: { conversationId },
            order: { createdAt: 'ASC' },
        });
    }

    async getStats(companyId: string) {
        const total = await this.convRepository.count({ where: { companyId } });
        const open = await this.convRepository.count({
            where: { companyId, status: ConversationStatus.AI_ACTIVE },
        });
        const humanRequested = await this.convRepository.count({
            where: { companyId, status: ConversationStatus.HUMAN_REQUESTED },
        });
        const closed = await this.convRepository.count({
            where: { companyId, status: ConversationStatus.CLOSED },
        });
        const totalMessages = await this.msgRepository
            .createQueryBuilder('msg')
            .innerJoin('msg.conversation', 'conv', 'conv.companyId = :companyId', { companyId })
            .getCount();

        return { total, open, humanRequested, closed, totalMessages };
    }

    async getWeeklyMessages(companyId: string): Promise<{ label: string; messages: number }[]> {
        const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const result: { label: string; messages: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const end = new Date(start.getTime() + 86_400_000);

            const count = await this.msgRepository
                .createQueryBuilder('msg')
                .innerJoin('msg.conversation', 'conv', 'conv.companyId = :companyId', { companyId })
                .where('msg.createdAt >= :start AND msg.createdAt < :end', { start, end })
                .getCount();

            result.push({ label: DAY_LABELS[date.getDay()], messages: count });
        }

        return result;
    }

    async updateLeadScore(id: string, companyId: string, score: number): Promise<void> {
        await this.convRepository.update({ id, companyId }, { leadScore: score });
    }

    async summarize(id: string, companyId: string, aiService: any): Promise<Conversation> {
        const conv = await this.findOne(id, companyId);
        const messages = await this.msgRepository.find({
            where: { conversationId: id },
            order: { createdAt: 'ASC' },
        });
        const summary = await aiService.summarizeConversation(messages);
        conv.summary = summary;
        return this.convRepository.save(conv);
    }

    async recordGap(question: string, companyId: string, agentId: string): Promise<void> {
        const existing = await this.kbGapRepository.findOne({
            where: { question, companyId, resolvedAt: undefined as any },
        });
        if (existing) {
            existing.count += 1;
            await this.kbGapRepository.save(existing);
        } else {
            const gap = this.kbGapRepository.create({ question, companyId, agentId });
            await this.kbGapRepository.save(gap);
        }
    }

    async getGaps(companyId: string): Promise<KbGap[]> {
        return this.kbGapRepository.find({
            where: { companyId },
            order: { count: 'DESC', createdAt: 'DESC' },
            take: 15,
        });
    }

    async resolveGap(id: string, companyId: string): Promise<KbGap> {
        const gap = await this.kbGapRepository.findOne({ where: { id, companyId } });
        if (!gap) throw new NotFoundException('Gap introuvable');
        gap.resolvedAt = new Date();
        return this.kbGapRepository.save(gap);
    }

    // #2 — Feedback ✓/✗ sur un message IA
    async addFeedback(messageId: string, conversationId: string, companyId: string, type: FeedbackType, correction?: string): Promise<MessageFeedback> {
        const existing = await this.feedbackRepository.findOne({ where: { messageId, companyId } });
        if (existing) {
            existing.type = type;
            if (correction !== undefined) existing.correction = correction;
            return this.feedbackRepository.save(existing);
        }
        const fb = this.feedbackRepository.create({ messageId, conversationId, companyId, type, correction });
        return this.feedbackRepository.save(fb);
    }

    async getFeedbacks(companyId: string): Promise<MessageFeedback[]> {
        return this.feedbackRepository.find({
            where: { companyId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async getNegativeFeedbacks(companyId: string): Promise<(MessageFeedback & { messageContent?: string })[]> {
        const feedbacks = await this.feedbackRepository.find({
            where: { companyId, type: FeedbackType.NEGATIVE },
            order: { createdAt: 'DESC' },
            take: 30,
        });
        // Enrich with message content
        const enriched = await Promise.all(
            feedbacks.map(async (fb) => {
                const msg = await this.msgRepository.findOne({ where: { id: fb.messageId } });
                return { ...fb, messageContent: msg?.content };
            }),
        );
        return enriched;
    }

    // #33 — Heatmap heures de pointe
    async getHeatmap(companyId: string): Promise<{ hour: number; day: number; count: number }[]> {
        const rows = await this.msgRepository
            .createQueryBuilder('msg')
            .select("EXTRACT(HOUR FROM msg.createdAt)", 'hour')
            .addSelect("EXTRACT(DOW FROM msg.createdAt)", 'day')
            .addSelect('COUNT(*)', 'count')
            .innerJoin('msg.conversation', 'conv', 'conv.companyId = :companyId', { companyId })
            .where("msg.sender = 'customer'")
            .groupBy('hour')
            .addGroupBy('day')
            .orderBy('count', 'DESC')
            .getRawMany();
        return rows.map((r) => ({ hour: parseInt(r.hour), day: parseInt(r.day), count: parseInt(r.count) }));
    }
}
