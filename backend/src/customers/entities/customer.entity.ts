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

@Entity('customers')
export class Customer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column()
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    waId: string;

    @Column({ nullable: true, type: 'varchar', default: 'prospect' })
    segment: string;

    @Column({ nullable: true, type: 'text' })
    notes: string;

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
