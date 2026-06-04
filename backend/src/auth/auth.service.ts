import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PlanName } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly companiesService: CompaniesService,
        private readonly subscriptionsService: SubscriptionsService,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('Cet email est déjà utilisé');
        }

        const user = await this.usersService.create({ email: dto.email, password: dto.password });
        const company = await this.companiesService.create({
            name: dto.companyName,
            email: dto.email,
            sector: dto.sector,
            phone: dto.phone,
            city: dto.city,
            userId: user.id,
        });

        await this.subscriptionsService.create({
            companyId: company.id,
            plan: PlanName.STARTER,
        });

        const token = this.signToken(user.id, company.id);
        return { token, company };
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Identifiants invalides');
        }

        const company = await this.companiesService.findByUserId(user.id);
        const token = this.signToken(user.id, company?.id ?? '');
        return { token, company };
    }

    private signToken(userId: string, companyId: string): string {
        return this.jwtService.sign({ sub: userId, companyId });
    }
}
