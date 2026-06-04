import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { Company } from '../../companies/entities/company.entity';

export enum HandoffStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    RESOLVED = 'resolved',
}

@Entity('handoff_requests')
export class HandoffRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: HandoffStatus,
        default: HandoffStatus.PENDING,
    })
    status: HandoffStatus;

    @Column({ nullable: true, type: 'text' })
    reason: string;

    @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
    @JoinColumn()
    conversation: Conversation;

    @Column()
    conversationId: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn()
    company: Company;

    @Column()
    companyId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
