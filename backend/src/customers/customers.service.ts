import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private readonly customersRepository: Repository<Customer>,
    ) { }

    async findOrCreateByWaId(waId: string, companyId: string, phone: string): Promise<Customer> {
        let customer = await this.customersRepository.findOne({ where: { waId, companyId } });
        if (!customer) {
            customer = this.customersRepository.create({ waId, phone, companyId });
            customer = await this.customersRepository.save(customer);
        }
        return customer;
    }

    async update(id: string, data: Partial<Customer>): Promise<Customer> {
        await this.customersRepository.update(id, data);
        return this.customersRepository.findOne({ where: { id } }) as Promise<Customer>;
    }

    async findAllByCompany(companyId: string, page = 1, limit = 30): Promise<{ data: Customer[]; total: number }> {
        const [data, total] = await this.customersRepository.findAndCount({
            where: { companyId },
            order: { updatedAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }

    async findOneWithConversations(id: string, companyId: string): Promise<Customer> {
        const customer = await this.customersRepository.findOne({ where: { id, companyId } });
        if (!customer) throw new NotFoundException('Client introuvable');
        return customer;
    }

    async updateByCompany(id: string, companyId: string, data: Partial<Customer>): Promise<Customer> {
        const customer = await this.customersRepository.findOne({ where: { id, companyId } });
        if (!customer) throw new NotFoundException('Client introuvable');
        Object.assign(customer, data);
        return this.customersRepository.save(customer);
    }

    // #20 — Segmentation automatique IA
    async autoSegment(id: string, companyId: string, aiService: any): Promise<Customer> {
        const customer = await this.customersRepository.findOne({ where: { id, companyId }, relations: ['conversations'] });
        if (!customer) throw new NotFoundException('Client introuvable');
        // Get last messages from all conversations of this customer
        const msgs: { sender: string; content: string }[] = [];
        const convs = await this.customersRepository.manager.find(
            'messages' as any,
            { where: { conversation: { customerId: id } }, take: 30, order: { createdAt: 'DESC' } } as any,
        );
        msgs.push(...(convs as any).map((m: any) => ({ sender: m.sender, content: m.content })));
        const segment = await aiService.autoSegmentCustomer(msgs);
        customer.segment = segment;
        return this.customersRepository.save(customer);
    }

    async autoSegmentAll(companyId: string, aiService: any): Promise<{ updated: number }> {
        const { data } = await this.findAllByCompany(companyId, 1, 100);
        let updated = 0;
        for (const c of data) {
            try {
                await this.autoSegment(c.id, companyId, aiService);
                updated++;
            } catch { /* skip errors per customer */ }
        }
        return { updated };
    }
}
