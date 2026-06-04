import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CustomersModule } from '../customers/customers.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Campaign]),
        CustomersModule,
        WhatsappModule,
    ],
    providers: [CampaignsService],
    controllers: [CampaignsController],
    exports: [CampaignsService],
})
export class CampaignsModule { }
