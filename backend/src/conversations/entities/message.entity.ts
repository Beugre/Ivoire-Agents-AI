import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

export enum MessageSender {
    CUSTOMER = 'customer',
    AI = 'ai',
    HUMAN_AGENT = 'human_agent',
}

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    DOCUMENT = 'document',
    AUDIO = 'audio',
}

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: MessageSender,
    })
    sender: MessageSender;

    @Column({
        type: 'enum',
        enum: MessageType,
        default: MessageType.TEXT,
    })
    type: MessageType;

    @Column({ nullable: true })
    waMessageId: string;

    @ManyToOne(() => Conversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
    @JoinColumn()
    conversation: Conversation;

    @Column()
    conversationId: string;

    @CreateDateColumn()
    createdAt: Date;
}
