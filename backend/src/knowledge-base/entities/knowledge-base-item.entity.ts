import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';
import { Company } from '../../companies/entities/company.entity';

export enum KBItemCategory {
    PRODUCT = 'product',
    SERVICE = 'service',
    PRICE = 'price',
    SCHEDULE = 'schedule',
    ADDRESS = 'address',
    FAQ = 'faq',
    DELIVERY = 'delivery',
    PAYMENT = 'payment',
    CONTACT = 'contact',
    OTHER = 'other',
}

@Entity('knowledge_base_items')
export class KnowledgeBaseItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'enum',
        enum: KBItemCategory,
        default: KBItemCategory.OTHER,
    })
    category: KBItemCategory;

    @Column({ type: 'float', array: true, nullable: true })
    embedding: number[];

    @ManyToOne(() => Agent, (agent) => agent.knowledgeBaseItems, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    agent: Agent;

    @Column()
    agentId: string;

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
