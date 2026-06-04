import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { HandoffService } from './handoff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('handoff')
export class HandoffController {
    constructor(private readonly handoffService: HandoffService) { }

    @Get('pending')
    getPending(@Request() req) {
        return this.handoffService.getPendingHandoffs(req.user.companyId);
    }

    @Post(':conversationId/request')
    request(
        @Param('conversationId', ParseUUIDPipe) conversationId: string,
        @Body('reason') reason: string,
        @Request() req,
    ) {
        return this.handoffService.requestHandoff(conversationId, req.user.companyId, reason);
    }

    @Post(':conversationId/accept')
    accept(@Param('conversationId', ParseUUIDPipe) conversationId: string, @Request() req) {
        return this.handoffService.acceptHandoff(conversationId, req.user.companyId);
    }

    @Post(':conversationId/resume-ai')
    resumeAi(@Param('conversationId', ParseUUIDPipe) conversationId: string, @Request() req) {
        return this.handoffService.resumeAi(conversationId, req.user.companyId);
    }
}
