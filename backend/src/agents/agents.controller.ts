import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
    constructor(private readonly agentsService: AgentsService) { }

    @Post()
    create(@Body() dto: CreateAgentDto, @Request() req) {
        return this.agentsService.create(dto, req.user.companyId);
    }

    @Get()
    findAll(@Request() req) {
        return this.agentsService.findAllByCompany(req.user.companyId);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.agentsService.findOne(id, req.user.companyId);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: Partial<CreateAgentDto>,
        @Request() req,
    ) {
        return this.agentsService.update(id, req.user.companyId, body);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.agentsService.remove(id, req.user.companyId);
    }
}
