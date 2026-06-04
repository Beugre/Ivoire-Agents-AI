import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { AgentsModule } from './agents/agents.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { ConversationsModule } from './conversations/conversations.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AiModule } from './ai/ai.module';
import { CustomersModule } from './customers/customers.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { HandoffModule } from './handoff/handoff.module';

import { User } from './users/entities/user.entity';
import { Company } from './companies/entities/company.entity';
import { Agent } from './agents/entities/agent.entity';
import { KnowledgeBaseItem } from './knowledge-base/entities/knowledge-base-item.entity';
import { KbGap } from './knowledge-base/entities/kb-gap.entity';
import { Conversation } from './conversations/entities/conversation.entity';
import { Message } from './conversations/entities/message.entity';
import { Customer } from './customers/entities/customer.entity';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { HandoffRequest } from './handoff/entities/handoff-request.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          User,
          Company,
          Agent,
          KnowledgeBaseItem,
          KbGap,
          Conversation,
          Message,
          Customer,
          Subscription,
          HandoffRequest,
        ],
        synchronize: true,
        ssl: config.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    AgentsModule,
    KnowledgeBaseModule,
    ConversationsModule,
    WhatsappModule,
    AiModule,
    CustomersModule,
    SubscriptionsModule,
    HandoffModule,
  ],
})
export class AppModule { }
