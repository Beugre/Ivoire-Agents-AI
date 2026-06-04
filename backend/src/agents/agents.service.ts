import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PlanName } from '../subscriptions/entities/subscription.entity';

const PLAN_AGENT_LIMITS: Record<PlanName, number> = {
    [PlanName.STARTER]: 1,
    [PlanName.BUSINESS]: 3,
    [PlanName.ENTERPRISE]: Infinity,
};

@Injectable()
export class AgentsService {
    constructor(
        @InjectRepository(Agent)
        private readonly agentsRepository: Repository<Agent>,
        private readonly subscriptionsService: SubscriptionsService,
    ) { }

    async create(dto: CreateAgentDto, companyId: string): Promise<Agent> {
        const sub = await this.subscriptionsService.findActiveByCompany(companyId);
        const limit = PLAN_AGENT_LIMITS[sub?.plan ?? PlanName.STARTER];
        const count = await this.agentsRepository.count({ where: { companyId } });
        if (count >= limit) {
            throw new ForbiddenException(
                `Votre abonnement ne permet pas plus de ${limit} agent(s). Passez à un plan supérieur.`,
            );
        }
        const agent = this.agentsRepository.create({ ...dto, companyId });
        return this.agentsRepository.save(agent);
    }

    async findAllByCompany(companyId: string): Promise<Agent[]> {
        return this.agentsRepository.find({ where: { companyId }, order: { createdAt: 'DESC' } });
    }

    async findOne(id: string, companyId: string): Promise<Agent> {
        const agent = await this.agentsRepository.findOne({ where: { id, companyId } });
        if (!agent) throw new NotFoundException('Agent introuvable');
        return agent;
    }

    async update(id: string, companyId: string, data: Partial<Agent>): Promise<Agent> {
        const agent = await this.findOne(id, companyId);
        Object.assign(agent, data);
        return this.agentsRepository.save(agent);
    }

    async remove(id: string, companyId: string): Promise<void> {
        const agent = await this.findOne(id, companyId);
        await this.agentsRepository.remove(agent);
    }
}
