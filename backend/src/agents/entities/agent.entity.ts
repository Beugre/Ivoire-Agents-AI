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
import { Company } from '../../companies/entities/company.entity';
import { KnowledgeBaseItem } from '../../knowledge-base/entities/knowledge-base-item.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

export enum AgentRole {
    COMMERCIAL = 'commercial',
    SUPPORT = 'support',
    SECRETARY = 'secretary',
    SAV = 'sav',
    RESERVATION = 'reservation',
}

export enum AgentTone {
    PROFESSIONAL = 'professional',
    WARM = 'warm',
    IVORIAN = 'ivorian',
    FORMAL = 'formal',
    FRIENDLY = 'friendly',
}

export enum AgentLanguage {
    FRENCH = 'french',
    IVORIAN_FRENCH = 'ivorian_french',
}

@Entity('agents')
export class Agent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: AgentRole,
        default: AgentRole.SUPPORT,
    })
    role: AgentRole;

    @Column({
        type: 'enum',
        enum: AgentTone,
        default: AgentTone.PROFESSIONAL,
    })
    tone: AgentTone;

    @Column({
        type: 'enum',
        enum: AgentLanguage,
        default: AgentLanguage.FRENCH,
    })
    language: AgentLanguage;

    @Column({ nullable: true, type: 'text' })
    welcomeMessage: string;

    @Column({ nullable: true, type: 'text' })
    customInstructions: string;

    @Column({ type: 'jsonb', nullable: true })
    availabilitySchedule: {
        monday?: { start: string; end: string };
        tuesday?: { start: string; end: string };
        wednesday?: { start: string; end: string };
        thursday?: { start: string; end: string };
        friday?: { start: string; end: string };
        saturday?: { start: string; end: string };
        sunday?: { start: string; end: string };
    };

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Company, (company) => company.agents, { onDelete: 'CASCADE' })
    @JoinColumn()
    company: Company;

    @Column()
    companyId: string;

    @OneToMany(() => KnowledgeBaseItem, (item) => item.agent)
    knowledgeBaseItems: KnowledgeBaseItem[];

    @OneToMany(() => Conversation, (conv) => conv.agent)
    conversations: Conversation[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
