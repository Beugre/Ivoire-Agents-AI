import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
    imports: [TypeOrmModule.forFeature([Agent]), SubscriptionsModule],
    providers: [AgentsService],
    controllers: [AgentsController],
    exports: [AgentsService],
})
export class AgentsModule { }
