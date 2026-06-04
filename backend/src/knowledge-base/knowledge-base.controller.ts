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
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
        @Body() body: { agentId: string; question: string; persona?: string },
        @Request() req,
    ) {
        return this.kbService.testAgentAnswer(body.agentId, req.user.companyId, body.question, this.aiService, body.persona);
    }

    @Post('import-url')
    async importFromUrl(
        @Body() body: { url: string; agentId: string },
        @Request() req,
    ) {
        if (!body.url?.startsWith('http')) throw new BadRequestException('URL invalide');
        const extracted = await this.aiService.scrapeAndExtract(body.url);
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

    @Post('import-file')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
    async importFromFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('agentId') agentId: string,
        @Request() req,
    ) {
        if (!file) throw new BadRequestException('Fichier requis');
        const text = file.buffer.toString('utf-8');
        if (!text.trim()) throw new BadRequestException('Fichier vide ou non lisible');
        const extracted = await this.aiService.extractKnowledgeFromText(text);
        const created: import('./entities/knowledge-base-item.entity').KnowledgeBaseItem[] = [];
        for (const item of extracted) {
            const saved = await this.kbService.create(
                { ...item, agentId } as import('./dto/create-kb-item.dto').CreateKbItemDto,
                req.user.companyId,
            );
            created.push(saved);
        }
        return created;
    }

    @Post('generate-faqs')
    async generateFaqs(
        @Body() body: { agentId: string },
        @Request() req,
    ) {
        return this.aiService.generateFaqs(body.agentId, req.user.companyId, this.kbService);
    }

    @Post('generate-pack')
    async generatePack(
        @Body() body: { sector: string; agentId: string },
        @Request() req,
    ) {
        if (!body.sector?.trim()) throw new BadRequestException('Secteur requis');
        return this.aiService.generateSectorPack(body.sector, body.agentId, req.user.companyId, this.kbService);
    }

    // #4 — Mode Formation : enseigner une Q→R à l'IA
    @Post('train')
    async train(
        @Body() body: { question: string; correction: string; agentId: string },
        @Request() req,
    ) {
        if (!body.question?.trim() || !body.correction?.trim()) throw new BadRequestException('Question et correction requises');
        const entry = await this.aiService.trainFromDialogue(body.question, body.correction);
        return this.kbService.create({ ...entry, agentId: body.agentId } as any, req.user.companyId);
    }

    // #34 — Détecter contradictions KB
    @Get('check-contradictions')
    async checkContradictions(@Request() req) {
        const items = await this.kbService.findByCompany(req.user.companyId);
        return this.aiService.checkContradictions(items.map((i) => ({ id: i.id, title: i.title, content: i.content })));
    }

    // #35 — Détecter entrées obsolètes
    @Get('detect-obsolete')
    async detectObsolete(@Request() req) {
        const items = await this.kbService.findByCompany(req.user.companyId);
        return this.aiService.detectObsolete(items.map((i) => ({ id: i.id, title: i.title, content: i.content, createdAt: i.createdAt })));
    }

    // #36 — Suggestions KB depuis conversations
    @Get('suggestions')
    getSuggestions(@Request() req) {
        return this.kbService.getSuggestions(req.user.companyId);
    }

    @Post('suggestions/:id/approve')
    approveSuggestion(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.kbService.approveSuggestion(id, req.user.companyId);
    }

    @Delete('suggestions/:id')
    deleteSuggestion(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.kbService.deleteSuggestion(id, req.user.companyId);
    }
}
