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
}
