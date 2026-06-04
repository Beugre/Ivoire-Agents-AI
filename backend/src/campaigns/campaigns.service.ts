import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus } from './entities/campaign.entity';

@Injectable()
export class CampaignsService {
    constructor(
        @InjectRepository(Campaign)
        private readonly campaignRepository: Repository<Campaign>,
    ) { }

    async create(companyId: string, name: string, message: string, segment?: string): Promise<Campaign> {
        const campaign = this.campaignRepository.create({ companyId, name, message, segment });
        return this.campaignRepository.save(campaign);
    }

    async findAll(companyId: string): Promise<Campaign[]> {
        return this.campaignRepository.find({
            where: { companyId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, companyId: string): Promise<Campaign> {
        const c = await this.campaignRepository.findOne({ where: { id, companyId } });
        if (!c) throw new NotFoundException('Campagne introuvable');
        return c;
    }

    async update(id: string, companyId: string, data: Partial<Campaign>): Promise<Campaign> {
        const c = await this.findOne(id, companyId);
        Object.assign(c, data);
        return this.campaignRepository.save(c);
    }

    async delete(id: string, companyId: string): Promise<void> {
        const c = await this.findOne(id, companyId);
        await this.campaignRepository.remove(c);
    }

    async send(id: string, companyId: string, customersService: any, whatsappService: any): Promise<Campaign> {
        const campaign = await this.findOne(id, companyId);
        if (campaign.status === CampaignStatus.RUNNING) {
            throw new Error('Campagne déjà en cours');
        }

        campaign.status = CampaignStatus.RUNNING;
        await this.campaignRepository.save(campaign);

        // Run asynchronously (fire and forget) so the endpoint returns fast
        this.processCampaign(campaign, customersService, whatsappService).catch(() => void 0);

        return campaign;
    }

    private async processCampaign(campaign: Campaign, customersService: any, whatsappService: any): Promise<void> {
        try {
            const { data: customers } = await customersService.findAllByCompany(campaign.companyId, 1, 500);
            const targets = campaign.segment
                ? customers.filter((c: any) => c.segment === campaign.segment)
                : customers;

            let sent = 0;
            let failed = 0;

            for (const customer of targets) {
                if (!customer.phone && !customer.waId) { failed++; continue; }
                try {
                    await whatsappService.sendTextMessage(customer.waId ?? customer.phone, campaign.message, campaign.companyId);
                    sent++;
                } catch {
                    failed++;
                }
                // Small delay to avoid rate limiting (1 message per 100ms)
                await new Promise((r) => setTimeout(r, 100));
            }

            await this.campaignRepository.update(campaign.id, {
                status: CampaignStatus.DONE,
                sentCount: sent,
                failedCount: failed,
                sentAt: new Date(),
            });
        } catch {
            await this.campaignRepository.update(campaign.id, { status: CampaignStatus.FAILED });
        }
    }
}
