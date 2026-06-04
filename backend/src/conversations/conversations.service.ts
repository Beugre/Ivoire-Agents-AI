import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationStatus } from './entities/conversation.entity';
import { Message, MessageSender } from './entities/message.entity';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private readonly convRepository: Repository<Conversation>,
        @InjectRepository(Message)
        private readonly msgRepository: Repository<Message>,
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
}
