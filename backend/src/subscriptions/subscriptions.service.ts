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

    async incrementUsage(companyId: string, tokensUsed = 0): Promise<void> {
        const sub = await this.findActiveByCompany(companyId);
        if (sub) {
            sub.messagesUsed += 1;
            sub.tokensUsed += tokensUsed;
            // gpt-4o-mini: ~$0.15/1M input + $0.60/1M output, on estime 50/50
            sub.estimatedCostUsd += (tokensUsed * 0.000000375);
            await this.subRepository.save(sub);
        }
    }

    async getUsageStats(companyId: string) {
        const subs = await this.findByCompany(companyId);
        const current = subs[0];
        if (!current) return null;
        const USD_TO_FCFA = 600;
        const PLAN_PRICES_FCFA: Record<string, number> = {
            starter: 0,
            business: 25000,
            enterprise: 75000,
        };
        const revenueFcfa = PLAN_PRICES_FCFA[current.plan] ?? 0;
        const costFcfa = Math.round((current.estimatedCostUsd ?? 0) * USD_TO_FCFA);
        return {
            plan: current.plan,
            messagesUsed: current.messagesUsed,
            tokensUsed: current.tokensUsed,
            estimatedCostUsd: current.estimatedCostUsd ?? 0,
            costFcfa,
            revenueFcfa,
            marginFcfa: revenueFcfa - costFcfa,
            marginPercent: revenueFcfa > 0 ? Math.round(((revenueFcfa - costFcfa) / revenueFcfa) * 100) : null,
            costPerMessage: current.messagesUsed > 0
                ? Math.round(costFcfa / current.messagesUsed)
                : 0,
        };
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
