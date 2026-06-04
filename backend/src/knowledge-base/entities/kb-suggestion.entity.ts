import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('kb_suggestions')
export class KbSuggestion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    companyId: string;

    @Column({ nullable: true })
    agentId: string;

    @Column({ type: 'text' })
    question: string;

    @Column({ type: 'text' })
    suggestedAnswer: string;

    @Column({ nullable: true })
    sourceConversationId: string;

    @Column({ nullable: true })
    approvedAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
