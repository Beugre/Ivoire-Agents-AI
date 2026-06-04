import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKbItemDto } from './dto/create-kb-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from '../ai/ai.service';

@UseGuards(JwtAuthGuard)
@Controller('knowledge-base')
export class KnowledgeBaseController {
    constructor(
        private readonly kbService: KnowledgeBaseService,
        private readonly aiService: AiService,
    ) { }

    @Post()
    create(@Body() dto: CreateKbItemDto, @Request() req) {
        return this.kbService.create(dto, req.user.companyId);
    }

    @Get()
    findAll(@Request() req, @Query('agentId') agentId?: string) {
        if (agentId) {
            return this.kbService.findByAgent(agentId, req.user.companyId);
        }
        return this.kbService.findByCompany(req.user.companyId);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: Partial<CreateKbItemDto>,
        @Request() req,
    ) {
        return this.kbService.update(id, req.user.companyId, body);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.kbService.remove(id, req.user.companyId);
    }

    @Post('import-text')
    async importFromText(
        @Body() body: { text: string; agentId: string },
        @Request() req,
    ) {
        const extracted = await this.aiService.extractKnowledgeFromText(body.text);
        const created: import('./entities/knowledge-base-item.entity').KnowledgeBaseItem[] = [];
        for (const item of extracted) {
            const saved = await this.kbService.create(
                { ...item, agentId: body.agentId } as import('./dto/create-kb-item.dto').CreateKbItemDto,
                req.user.companyId,
            );
            created.push(saved);
        }
        return created;
    }

    @Post('test-agent')
    async testAgent(
        @Body() body: { agentId: string; question: string },
        @Request() req,
    ) {
        return this.kbService.testAgentAnswer(body.agentId, req.user.companyId, body.question, this.aiService);
    }
}
