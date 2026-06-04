import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WhatsappConnectionService, EmbeddedSignupDto, SafeConnectionStatus } from './whatsapp-connection.service';
import { WhatsappService } from './whatsapp.service';

@UseGuards(JwtAuthGuard)
@Controller('whatsapp-connect')
export class WhatsappConnectionController {
    private readonly logger = new Logger(WhatsappConnectionController.name);

    constructor(
        private readonly connectionService: WhatsappConnectionService,
        private readonly whatsappService: WhatsappService,
    ) { }

    /**
     * POST /whatsapp-connect/embedded-signup
     * Appelé après le flow Meta Embedded Signup côté frontend.
     * Le frontend envoie { accessToken, wabaId, phoneNumberId? }.
     */
    @Post('embedded-signup')
    async embeddedSignup(
        @Request() req,
        @Body() body: { accessToken: string; wabaId: string; phoneNumberId?: string; metaBusinessId?: string },
    ): Promise<SafeConnectionStatus> {
        const { accessToken, wabaId, phoneNumberId, metaBusinessId } = body;
        if (!accessToken || !wabaId) {
            throw new BadRequestException('accessToken et wabaId requis');
        }
        const companyId: string = req.user.companyId;
        return this.connectionService.processEmbeddedSignup(companyId, {
            accessToken,
            wabaId,
            phoneNumberId,
            metaBusinessId,
        } as EmbeddedSignupDto);
    }

    /**
     * GET /whatsapp-connect/status
     * Retourne le statut de connexion — JAMAIS le token.
     */
    @Get('status')
    async getStatus(@Request() req): Promise<SafeConnectionStatus> {
        return this.connectionService.getStatus(req.user.companyId);
    }

    /**
     * POST /whatsapp-connect/test-message
     * Envoie un message test au numéro connecté.
     */
    @Post('test-message')
    @HttpCode(HttpStatus.OK)
    async testMessage(@Request() req): Promise<{ success: boolean; message: string }> {
        const companyId: string = req.user.companyId;
        const conn = await this.connectionService.getActiveConnection(companyId);
        if (!conn) {
            return { success: false, message: 'Aucune connexion WhatsApp active' };
        }

        try {
            const token = this.connectionService.decryptToken(conn.accessTokenEncrypted);
            // Envoie un message test au numéro connecté lui-même
            await this.whatsappService.sendMessageWithToken(
                conn.phoneNumberId,
                conn.displayPhoneNumber.replace(/\s+/g, '').replace('+', ''),
                '✅ Connexion WhatsApp opérationnelle ! Vos clients peuvent maintenant vous envoyer des messages.',
                token,
            );
            return { success: true, message: `Message test envoyé au ${conn.displayPhoneNumber}` };
        } catch (err: any) {
            this.logger.error('Erreur message test', err?.response?.data ?? err.message);
            return { success: false, message: err?.response?.data?.error?.message ?? 'Erreur lors de l\'envoi' };
        }
    }

    /**
     * DELETE /whatsapp-connect
     * Déconnecte WhatsApp pour cette entreprise.
     */
    @Delete()
    @HttpCode(HttpStatus.OK)
    async disconnect(@Request() req): Promise<{ success: boolean }> {
        await this.connectionService.disconnect(req.user.companyId);
        return { success: true };
    }
}
