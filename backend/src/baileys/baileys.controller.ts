import {
    Controller,
    Get,
    Post,
    Delete,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BaileysService } from './baileys.service';

@UseGuards(JwtAuthGuard)
@Controller('baileys')
export class BaileysController {
    private readonly logger = new Logger(BaileysController.name);

    constructor(private readonly baileysService: BaileysService) { }

    /**
     * POST /baileys/start-session
     * Démarre ou redémarre une session QR pour cette entreprise.
     */
    @Post('start-session')
    @HttpCode(HttpStatus.OK)
    async startSession(@Request() req) {
        const companyId: string = req.user.companyId;
        // Lance en arrière-plan pour ne pas bloquer la réponse HTTP
        this.baileysService.startSession(companyId).catch((err) =>
            this.logger.error(`Erreur démarrage session ${companyId}`, err),
        );
        return { message: 'Session démarrée — scannez le QR code dans quelques secondes.' };
    }

    /**
     * GET /baileys/status
     * Retourne le statut + QR code base64 (si en attente) ou numéro connecté.
     */
    @Get('status')
    async getStatus(@Request() req) {
        return this.baileysService.getStatus(req.user.companyId);
    }

    /**
     * DELETE /baileys/session
     * Déconnecte et efface la session WhatsApp.
     */
    @Delete('session')
    @HttpCode(HttpStatus.OK)
    async disconnect(@Request() req) {
        await this.baileysService.disconnect(req.user.companyId);
        return { success: true };
    }
}
