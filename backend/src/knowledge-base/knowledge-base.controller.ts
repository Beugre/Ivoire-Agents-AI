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

@UseGuards(JwtAuthGuard)
@Controller('knowledge-base')
export class KnowledgeBaseController {
    constructor(private readonly kbService: KnowledgeBaseService) { }

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
}
