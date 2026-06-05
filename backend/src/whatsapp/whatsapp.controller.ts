import {
    Controller,
    Get,
    Post,
    Query,
    Body,
    Res,
    Req,
    Headers,
    HttpCode,
    HttpStatus,
    Logger,
    ForbiddenException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { WhatsappService } from './whatsapp.service';

@SkipThrottle()

@Controller('webhooks/whatsapp')
export class WhatsappController {
    private readonly logger = new Logger(WhatsappController.name);

    constructor(
        private readonly whatsappService: WhatsappService,
        private readonly configService: ConfigService,
    ) { }

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
    async handleMessage(
        @Body() body: any,
        @Headers('x-hub-signature-256') signature: string,
    ) {
        const appSecret = this.configService.get<string>('META_APP_SECRET');
        if (appSecret) {
            const expected = 'sha256=' + crypto
                .createHmac('sha256', appSecret)
                .update(JSON.stringify(body))
                .digest('hex');
            if (!signature || signature !== expected) {
                this.logger.warn('Signature webhook Meta invalide — requête rejetée');
                throw new ForbiddenException('Signature invalide');
            }
        }
        this.logger.log('Webhook WhatsApp reçu');
        await this.whatsappService.handleIncomingMessage(body);
        return { status: 'ok' };
    }
}
