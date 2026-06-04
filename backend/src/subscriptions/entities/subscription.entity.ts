import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

export enum PlanName {
    STARTER = 'starter',
    BUSINESS = 'business',
    ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
    ACTIVE = 'active',
    TRIALING = 'trialing',
    PAST_DUE = 'past_due',
    CANCELED = 'canceled',
}

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: PlanName,
        default: PlanName.STARTER,
    })
    plan: PlanName;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.TRIALING,
    })
    status: SubscriptionStatus;

    @Column({ default: 0 })
    messagesUsed: number;

    @Column({ default: 0 })
    tokensUsed: number;

    @Column({ type: 'float', default: 0 })
    estimatedCostUsd: number;

    @Column({ nullable: true })
    stripeSubscriptionId: string;

    @Column({ nullable: true })
    currentPeriodEnd: Date;

    @ManyToOne(() => Company, (company) => company.subscriptions, { onDelete: 'CASCADE' })
    @JoinColumn()
    company: Company;

    @Column()
    companyId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
