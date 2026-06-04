import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ConversationsModule } from '../conversations/conversations.module';
import { AgentsModule } from '../agents/agents.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { AiModule } from '../ai/ai.module';
import { CustomersModule } from '../customers/customers.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
    imports: [
        ConversationsModule,
        AgentsModule,
        KnowledgeBaseModule,
        AiModule,
        CustomersModule,
        SubscriptionsModule,
        CompaniesModule,
    ],
    providers: [WhatsappService],
    controllers: [WhatsappController],
})
export class WhatsappModule { }
