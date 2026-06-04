import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, PlanName, SubscriptionStatus } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectRepository(Subscription)
        private readonly subRepository: Repository<Subscription>,
    ) { }

    async create(data: Partial<Subscription>): Promise<Subscription> {
        const sub = this.subRepository.create(data);
        return this.subRepository.save(sub);
    }

    async findActiveByCompany(companyId: string): Promise<Subscription | null> {
        return this.subRepository.findOne({
            where: { companyId, status: SubscriptionStatus.ACTIVE },
        }) ?? this.subRepository.findOne({ where: { companyId } });
    }

    async findByCompany(companyId: string): Promise<Subscription[]> {
        return this.subRepository.find({
            where: { companyId },
            order: { createdAt: 'DESC' },
        });
    }

    async incrementUsage(companyId: string): Promise<void> {
        const sub = await this.findActiveByCompany(companyId);
        if (sub) {
            sub.messagesUsed += 1;
            await this.subRepository.save(sub);
        }
    }

    getPlanLimits(plan: PlanName): { maxAgents: number; maxMessages: number } {
        const limits = {
            [PlanName.STARTER]: { maxAgents: 1, maxMessages: 1000 },
            [PlanName.BUSINESS]: { maxAgents: 3, maxMessages: 10000 },
            [PlanName.ENTERPRISE]: { maxAgents: Infinity, maxMessages: Infinity },
        };
        return limits[plan];
    }
}
