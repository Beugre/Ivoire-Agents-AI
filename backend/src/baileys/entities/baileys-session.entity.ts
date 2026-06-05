import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('baileys_sessions')
export class BaileysSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column()
    companyId: string;

    /** Credentials Baileys (sérialisées avec BufferJSON) */
    @Column({ type: 'jsonb', nullable: true })
    creds: any;

    /** Signal keys (pré-clés, sessions, etc.) */
    @Column({ type: 'jsonb', nullable: true, default: '{}' })
    keys: any;

    /** qr_pending | connected | disconnected */
    @Column({ default: 'disconnected' })
    status: string;

    /** Numéro WhatsApp connecté (ex: 2250102030405) */
    @Column({ nullable: true })
    phoneNumber: string;

    /** Nom d'affichage WhatsApp */
    @Column({ nullable: true })
    displayName: string;

    /** QR code courant (base64 PNG) — null quand connecté */
    @Column({ nullable: true, type: 'text' })
    lastQr: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
