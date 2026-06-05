import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaileysSession } from './entities/baileys-session.entity';
import { BaileysService } from './baileys.service';
import { BaileysController } from './baileys.controller';
import { ConversationsModule } from '../conversations/conversations.module';
import { AgentsModule } from '../agents/agents.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { AiModule } from '../ai/ai.module';
import { CustomersModule } from '../customers/customers.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([BaileysSession]),
        ConversationsModule,
        AgentsModule,
        KnowledgeBaseModule,
        AiModule,
        CustomersModule,
        SubscriptionsModule,
        CompaniesModule,
    ],
    providers: [BaileysService],
    controllers: [BaileysController],
    exports: [BaileysService],
})
export class BaileysModule { }
