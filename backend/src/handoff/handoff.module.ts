import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HandoffRequest } from './entities/handoff-request.entity';
import { HandoffService } from './handoff.service';
import { HandoffController } from './handoff.controller';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
    imports: [TypeOrmModule.forFeature([HandoffRequest]), ConversationsModule],
    providers: [HandoffService],
    controllers: [HandoffController],
})
export class HandoffModule { }
