import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeBaseItem } from './entities/knowledge-base-item.entity';
import { KbSuggestion } from './entities/kb-suggestion.entity';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [TypeOrmModule.forFeature([KnowledgeBaseItem, KbSuggestion]), AiModule],
    providers: [KnowledgeBaseService],
    controllers: [KnowledgeBaseController],
    exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule { }
