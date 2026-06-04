import {
    Controller,
    Get,
    Patch,
    Post,
    Param,
    Body,
    UseGuards,
    Request,
    ParseUUIDPipe,
    Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from '../ai/ai.service';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
    constructor(
        private readonly customersService: CustomersService,
        private readonly aiService: AiService,
    ) { }

    @Get()
    findAll(
        @Request() req,
        @Query('page') page = '1',
        @Query('limit') limit = '30',
    ) {
        return this.customersService.findAllByCompany(
            req.user.companyId,
            parseInt(page),
            parseInt(limit),
        );
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.customersService.findOneWithConversations(id, req.user.companyId);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { segment?: string; notes?: string; name?: string },
        @Request() req,
    ) {
        return this.customersService.updateByCompany(id, req.user.companyId, body);
    }

    // #20 — Segmentation auto IA
    @Post(':id/auto-segment')
    async autoSegment(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.customersService.autoSegment(id, req.user.companyId, this.aiService);
    }

    @Post('auto-segment-all')
    async autoSegmentAll(@Request() req) {
        return this.customersService.autoSegmentAll(req.user.companyId, this.aiService);
    }
}
