import {
    Controller, Get, Post, Patch, Delete, Body, Param,
    UseGuards, Request, ParseUUIDPipe,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from '../customers/customers.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
    constructor(
        private readonly campaignsService: CampaignsService,
        private readonly customersService: CustomersService,
        private readonly whatsappService: WhatsappService,
    ) { }

    @Get()
    findAll(@Request() req) {
        return this.campaignsService.findAll(req.user.companyId);
    }

    @Post()
    create(
        @Body() body: { name: string; message: string; segment?: string },
        @Request() req,
    ) {
        return this.campaignsService.create(req.user.companyId, body.name, body.message, body.segment);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { name?: string; message?: string; segment?: string },
        @Request() req,
    ) {
        return this.campaignsService.update(id, req.user.companyId, body);
    }

    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.campaignsService.delete(id, req.user.companyId);
    }

    @Post(':id/send')
    send(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.campaignsService.send(id, req.user.companyId, this.customersService, this.whatsappService);
    }
}
