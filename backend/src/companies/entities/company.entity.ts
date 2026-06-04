import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    sector: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ nullable: true })
    logoUrl: string;

    @Column({ nullable: true })
    whatsappPhoneNumberId: string;

    @Column({ nullable: true })
    whatsappConnected: boolean;

    @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @Column()
    userId: string;

    @OneToMany(() => Agent, (agent) => agent.company)
    agents: Agent[];

    @OneToMany(() => Subscription, (sub) => sub.company)
    subscriptions: Subscription[];

    @Column({ nullable: true, type: 'text' })
    memory: string; // #38 — Mémoire entreprise injectée dans le prompt IA

    @Column({ nullable: true, default: false })
    relanceEnabled: boolean; // #29 — Relance auto activée

    @Column({ nullable: true, default: 7 })
    relanceDays: number; // Délai inactivité (jours) avant relance

    @Column({ nullable: true, type: 'text' })
    relanceMessage: string; // Message de relance

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
