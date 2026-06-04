import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationStatus } from './entities/conversation.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from '../ai/ai.service';
import { MessageSender } from './entities/message.entity';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
    constructor(
        private readonly conversationsService: ConversationsService,
        private readonly aiService: AiService,
    ) { }

    @Get()
    findAll(@Request() req, @Query('page') page = '1', @Query('limit') limit = '20') {
        return this.conversationsService.findAllByCompany(
            req.user.companyId,
            parseInt(page),
            parseInt(limit),
        );
    }

    @Get('stats')
    getStats(@Request() req) {
        return this.conversationsService.getStats(req.user.companyId);
    }

    @Get('stats/weekly')
    getWeeklyStats(@Request() req) {
        return this.conversationsService.getWeeklyMessages(req.user.companyId);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.conversationsService.findOne(id, req.user.companyId);
    }

    @Get(':id/messages')
    getMessages(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.conversationsService.getMessages(id, req.user.companyId);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: ConversationStatus,
        @Request() req,
    ) {
        return this.conversationsService.updateStatus(id, req.user.companyId, status);
    }

    @Post(':id/note')
    addNote(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('note') note: string,
        @Request() req,
    ) {
        return this.conversationsService.addNote(id, req.user.companyId, note);
    }

    @Post(':id/summarize')
    summarize(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.conversationsService.summarize(id, req.user.companyId, this.aiService);
    }

    @Post(':id/send-human')
    async sendAsHuman(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('message') message: string,
        @Request() req,
    ) {
        const conv = await this.conversationsService.findOne(id, req.user.companyId);
        if (conv.status !== ConversationStatus.HUMAN_ACTIVE) {
            await this.conversationsService.updateStatus(id, req.user.companyId, ConversationStatus.HUMAN_ACTIVE);
        }
        return this.conversationsService.addMessage(id, message, MessageSender.HUMAN_AGENT);
    }

    @Get('gaps')
    getGaps(@Request() req) {
        return this.conversationsService.getGaps(req.user.companyId);
    }

    @Patch('gaps/:id/resolve')
    resolveGap(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.conversationsService.resolveGap(id, req.user.companyId);
    }
}
