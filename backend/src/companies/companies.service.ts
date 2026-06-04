import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesService {
    constructor(
        @InjectRepository(Company)
        private readonly companiesRepository: Repository<Company>,
    ) { }

    async create(data: Partial<Company>): Promise<Company> {
        const company = this.companiesRepository.create(data);
        return this.companiesRepository.save(company);
    }

    async findByUserId(userId: string): Promise<Company | null> {
        return this.companiesRepository.findOne({ where: { userId } });
    }

    async findById(id: string): Promise<Company | null> {
        return this.companiesRepository.findOne({ where: { id } });
    }

    async findByPhoneNumberId(phoneNumberId: string): Promise<Company | null> {
        return this.companiesRepository.findOne({
            where: { whatsappPhoneNumberId: phoneNumberId },
        });
    }

    async update(id: string, data: Partial<Company>): Promise<Company> {
        await this.companiesRepository.update(id, data);
        const updated = await this.findById(id);
        if (!updated) throw new NotFoundException('Entreprise introuvable');
        return updated;
    }
}
