import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappConnectionService } from './whatsapp-connection.service';
import { WhatsappConnectionController } from './whatsapp-connection.controller';
import { WhatsappConnection } from './entities/whatsapp-connection.entity';
import { ConversationsModule } from '../conversations/conversations.module';
import { AgentsModule } from '../agents/agents.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { AiModule } from '../ai/ai.module';
import { CustomersModule } from '../customers/customers.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([WhatsappConnection]),
        ConversationsModule,
        AgentsModule,
        KnowledgeBaseModule,
        AiModule,
        CustomersModule,
        SubscriptionsModule,
        CompaniesModule,
    ],
    providers: [WhatsappService, WhatsappConnectionService],
    controllers: [WhatsappController, WhatsappConnectionController],
    exports: [WhatsappService, WhatsappConnectionService],
})
export class WhatsappModule { }
