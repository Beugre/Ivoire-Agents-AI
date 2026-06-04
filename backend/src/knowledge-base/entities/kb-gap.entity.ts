import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('kb_gaps')
export class KbGap {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    question: string;

    @Column({ default: 1 })
    count: number;

    @Column()
    companyId: string;

    @Column({ nullable: true })
    agentId: string;

    @Column({ nullable: true })
    resolvedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
