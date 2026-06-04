import {
    Controller,
    Get,
    Post,
    Query,
    Body,
    Res,
    HttpCode,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { WhatsappService } from './whatsapp.service';

@Controller('webhooks/whatsapp')
export class WhatsappController {
    private readonly logger = new Logger(WhatsappController.name);

    constructor(private readonly whatsappService: WhatsappService) { }

    @Get()
    verifyWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.verify_token') token: string,
        @Query('hub.challenge') challenge: string,
        @Res() res: Response,
    ) {
        try {
            const result = this.whatsappService.verifyWebhook(mode, token, challenge);
            res.status(200).send(result);
        } catch {
            res.status(403).send('Forbidden');
        }
    }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleMessage(@Body() body: any) {
        this.logger.log('Webhook WhatsApp reçu');
        await this.whatsappService.handleIncomingMessage(body);
        return { status: 'ok' };
    }
}
