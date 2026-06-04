import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @Get()
    findAll(@Request() req) {
        return this.subscriptionsService.findByCompany(req.user.companyId);
    }

    @Get('current')
    getCurrent(@Request() req) {
        return this.subscriptionsService.findActiveByCompany(req.user.companyId);
    }

    @Get('stats')
    getStats(@Request() req) {
        return this.subscriptionsService.getUsageStats(req.user.companyId);
    }
}
