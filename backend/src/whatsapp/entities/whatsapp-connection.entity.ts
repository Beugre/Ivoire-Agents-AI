import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('whatsapp_connections')
export class WhatsappConnection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column()
    companyId: string;

    @Column({ default: 'meta' })
    provider: string;

    @Column({ nullable: true })
    metaBusinessId: string;

    @Column({ nullable: true })
    wabaId: string;

    @Index()
    @Column()
    phoneNumberId: string;

    @Column()
    displayPhoneNumber: string;

    /** Token chiffré AES-256-GCM — jamais retourné au frontend */
    @Column({ type: 'text' })
    accessTokenEncrypted: string;

    @Column({ nullable: true, type: 'timestamp' })
    tokenExpiresAt: Date;

    /** Token unique pour vérification webhook Meta (non exposé) */
    @Column({ nullable: true })
    webhookVerifyToken: string;

    /** pending | verified | error */
    @Column({ default: 'pending' })
    webhookStatus: string;

    /** GREEN | YELLOW | RED */
    @Column({ nullable: true })
    qualityRating: string;

    /** active | disconnected | error */
    @Column({ default: 'active' })
    connectionStatus: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
