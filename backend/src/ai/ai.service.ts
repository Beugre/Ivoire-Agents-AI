import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Agent, AgentTone } from '../agents/entities/agent.entity';
import { Message } from '../conversations/entities/message.entity';

const TONE_INSTRUCTIONS: Record<AgentTone, string> = {
    [AgentTone.PROFESSIONAL]:
        'Utilise un langage professionnel, formel et soigné.',
    [AgentTone.WARM]:
        'Sois chaleureux, bienveillant et empathique dans tes réponses.',
    [AgentTone.IVORIAN]:
        "Adopte un ton ivoirien, naturel et accessible. Tu peux utiliser des expressions courantes de Côte d'Ivoire.",
    [AgentTone.FORMAL]:
        'Sois très formel, utilise le vouvoiement systématiquement.',
    [AgentTone.FRIENDLY]:
        "Sois décontracté, sympa et proche du client, comme un ami qui aide.",
};

@Injectable()
export class AiService {
    private openai: OpenAI;

    constructor(private readonly configService: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        });
    }

    async generateReply(
        agent: Agent,
        companyContext: string,
        knowledgeBase: string,
        conversationHistory: Message[],
        customerMessage: string,
    ): Promise<string> {
        const toneInstruction = TONE_INSTRUCTIONS[agent.tone];

        const systemPrompt = `Tu es ${agent.name}, un employé virtuel IA pour une entreprise en Côte d'Ivoire.

Ton rôle : ${agent.role}
${toneInstruction}
Langue : ${agent.language === 'ivorian_french' ? "Français ivoirien naturel, accessible" : "Français standard"}

Instructions personnalisées :
${agent.customInstructions ?? "Réponds de manière utile et précise."}

Tu dois :
- Répondre poliment et de manière concise (maximum 3 paragraphes sauf demande complexe)
- Utiliser UNIQUEMENT les informations de l'entreprise pour répondre
- Ne jamais inventer de prix, services ou informations non fournis
- Demander une clarification si la demande est ambiguë
- Proposer de transférer à un humain si tu ne peux pas aider (réponds alors "HANDOFF_REQUIRED")
- Détecter les demandes urgentes et les signaler (réponds alors "URGENT: [ta réponse]")
- Collecter le nom et le téléphone du client si c'est un premier contact et s'il n'est pas encore identifié

Informations entreprise :
${companyContext}

Base de connaissances :
${knowledgeBase}`;

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
        ];

        for (const msg of conversationHistory.slice(-10)) {
            messages.push({
                role: msg.sender === 'customer' ? 'user' : 'assistant',
                content: msg.content,
            });
        }

        messages.push({ role: 'user', content: customerMessage });

        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 500,
            temperature: 0.7,
        });

        return completion.choices[0]?.message?.content ?? "Je suis désolé, je ne peux pas répondre pour le moment.";
    }
}
