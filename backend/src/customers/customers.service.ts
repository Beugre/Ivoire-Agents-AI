import { Injectable } from '@nestjs/common';
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
}
