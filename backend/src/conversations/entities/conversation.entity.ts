import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';
import { Company } from '../../companies/entities/company.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Message } from './message.entity';

export enum ConversationStatus {
    AI_ACTIVE = 'ai_active',
    HUMAN_REQUESTED = 'human_requested',
    HUMAN_ACTIVE = 'human_active',
    CLOSED = 'closed',
}

export enum ConversationChannel {
    WHATSAPP = 'whatsapp',
    WEB = 'web',
}

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ConversationStatus,
        default: ConversationStatus.AI_ACTIVE,
    })
    status: ConversationStatus;

    @Column({
        type: 'enum',
        enum: ConversationChannel,
        default: ConversationChannel.WHATSAPP,
    })
    channel: ConversationChannel;

    @Column({ nullable: true })
    waConversationId: string;

    @Column({ nullable: true, type: 'text' })
    internalNote: string;

    @ManyToOne(() => Agent, (agent) => agent.conversations, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn()
    agent: Agent;

    @Column({ nullable: true })
    agentId: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn()
    company: Company;

    @Column()
    companyId: string;

    @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true, eager: true })
    @JoinColumn()
    customer: Customer;

    @Column({ nullable: true })
    customerId: string;

    @OneToMany(() => Message, (msg) => msg.conversation, { cascade: true })
    messages: Message[];

    @Column({ nullable: true, type: 'int' })
    leadScore: number;

    @Column({ nullable: true, type: 'text' })
    summary: string;

    @Column({ nullable: true })
    closedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
