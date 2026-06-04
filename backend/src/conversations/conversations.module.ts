import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { KbGap } from '../knowledge-base/entities/kb-gap.entity';
import { MessageFeedback } from './entities/message-feedback.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [TypeOrmModule.forFeature([Conversation, Message, KbGap, MessageFeedback]), AiModule],
    providers: [ConversationsService],
    controllers: [ConversationsController],
    exports: [ConversationsService],
})
export class ConversationsModule { }
