import {
    Controller,
    Get,
    Patch,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
    constructor(private readonly companiesService: CompaniesService) { }

    @Get('me')
    async getMyCompany(@Request() req) {
        return this.companiesService.findById(req.user.companyId);
    }

    @Patch('me')
    async updateMyCompany(@Request() req, @Body() body) {
        const { id, userId, user, agents, subscriptions, ...safe } = body;
        return this.companiesService.update(req.user.companyId, safe);
    }
}
