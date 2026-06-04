import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HandoffRequest, HandoffStatus } from './entities/handoff-request.entity';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationStatus } from '../conversations/entities/conversation.entity';

@Injectable()
export class HandoffService {
    constructor(
        @InjectRepository(HandoffRequest)
        private readonly handoffRepository: Repository<HandoffRequest>,
        private readonly conversationsService: ConversationsService,
    ) { }

    async requestHandoff(conversationId: string, companyId: string, reason?: string): Promise<HandoffRequest> {
        await this.conversationsService.updateStatus(
            conversationId,
            companyId,
            ConversationStatus.HUMAN_REQUESTED,
        );

        const req = this.handoffRepository.create({ conversationId, companyId, reason });
        return this.handoffRepository.save(req);
    }

    async acceptHandoff(conversationId: string, companyId: string): Promise<HandoffRequest> {
        await this.conversationsService.updateStatus(
            conversationId,
            companyId,
            ConversationStatus.HUMAN_ACTIVE,
        );
        const req = await this.handoffRepository.findOne({ where: { conversationId } });
        if (req) {
            req.status = HandoffStatus.ACCEPTED;
            return this.handoffRepository.save(req);
        }
        return this.handoffRepository.create({ conversationId, companyId, status: HandoffStatus.ACCEPTED });
    }

    async resumeAi(conversationId: string, companyId: string): Promise<void> {
        await this.conversationsService.updateStatus(
            conversationId,
            companyId,
            ConversationStatus.AI_ACTIVE,
        );
    }

    async getPendingHandoffs(companyId: string): Promise<HandoffRequest[]> {
        return this.handoffRepository.find({
            where: { companyId, status: HandoffStatus.PENDING },
            order: { createdAt: 'DESC' },
        });
    }
}
