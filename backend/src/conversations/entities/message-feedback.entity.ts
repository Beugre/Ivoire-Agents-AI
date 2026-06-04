import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum FeedbackType {
    POSITIVE = 'positive',
    NEGATIVE = 'negative',
}

@Entity('message_feedbacks')
export class MessageFeedback {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    messageId: string;

    @Column()
    conversationId: string;

    @Column()
    companyId: string;

    @Column({ type: 'enum', enum: FeedbackType })
    type: FeedbackType;

    @Column({ nullable: true, type: 'text' })
    correction: string;

    @CreateDateColumn()
    createdAt: Date;
}
