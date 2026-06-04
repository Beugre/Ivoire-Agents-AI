import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CampaignStatus {
    DRAFT = 'draft',
    RUNNING = 'running',
    DONE = 'done',
    FAILED = 'failed',
}

@Entity('campaigns')
export class Campaign {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    companyId: string;

    @Column()
    name: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ nullable: true })
    segment: string; // null = all customers

    @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
    status: CampaignStatus;

    @Column({ default: 0 })
    sentCount: number;

    @Column({ default: 0 })
    failedCount: number;

    @Column({ nullable: true, type: 'timestamp' })
    sentAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
