import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Agent, AgentTone } from '../agents/entities/agent.entity';
import { Message } from '../conversations/entities/message.entity';
import { buildNouchiContext } from './nouchi-vocabulary';

const TONE_INSTRUCTIONS: Record<AgentTone, string> = {
    [AgentTone.PROFESSIONAL]:
        'Utilise un langage professionnel, formel et soigné.',
    [AgentTone.WARM]:
        'Sois chaleureux, bienveillant et empathique dans tes réponses.',
    [AgentTone.IVORIAN]:
        "Adopte un ton ivoirien authentique. Tu parles le nouchi couramment. Utilise les salutations nouchi, les expressions d'approbation et de réconfort naturellement dans tes réponses. Reste proche, chaleureux et naturel comme un ivoirien.",
    [AgentTone.FORMAL]:
        'Sois très formel, utilise le vouvoiement systématiquement.',
    [AgentTone.FRIENDLY]:
        "Sois décontracté, sympa et proche du client comme un ami qui aide.",
};

const CI_CONTEXT = `
CONTEXTE CÔTE D'IVOIRE — RÈGLES IMPORTANTES :
- Tu opères en Côte d'Ivoire. Les prix sont en FCFA (Francs CFA). Ne mentionne jamais d'euros ou de dollars sauf demande explicite.
- Tu comprends le nouchi (argot ivoirien/abidjanais) : "gbê" = vrai, "gâter" = abîmer, "djo" = personne, "on va kpindé" = on va partir, "ça va" peut s'écrire "sava", "frê" = frère, "zié" = voir/regarder, "décaler" = partir, "go" = femme/fille, "wêwê" = vraiment, "c'est comment ?" = comment ça va ?
- Si quelqu'un écrit en nouchi, réponds dans un mélange naturel de français ivoirien + nouchi selon le ton configuré.
- Pour les adresses : en CI, on utilise souvent des repères géographiques (quartiers, carrefours, points connus) plutôt que des adresses précises. Si tu donnes une localisation, propose un lien Google Maps et décris les repères.
- Les numéros de téléphone CI commencent par +225 et ont 10 chiffres après l'indicatif.
- Sois conscient des réalités locales : coupures de courant ("délestage"), Mobile Money (MTN MoMo, Orange Money, Wave), marchés locaux, etc.
`;


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
    ): Promise<{ text: string; totalTokens: number; isFallback: boolean }> {
        const toneInstruction = TONE_INSTRUCTIONS[agent.tone];

        const systemPrompt = `Tu es ${agent.name}, un employé virtuel IA pour une entreprise en Côte d'Ivoire.

Ton rôle : ${agent.role}
${toneInstruction}
Langue : ${agent.language === 'ivorian_french' ? "Français ivoirien naturel, tu peux utiliser des expressions du nouchi" : "Français standard"}

Instructions personnalisées :
${agent.customInstructions ?? "Réponds de manière utile et précise."}

${CI_CONTEXT}
${agent.tone === AgentTone.IVORIAN ? buildNouchiContext() : ''}
Tu dois :
- Répondre poliment et de manière concise (maximum 3 paragraphes sauf demande complexe)
- Utiliser UNIQUEMENT les informations de l'entreprise pour répondre
- Ne jamais inventer de prix, services ou informations non fournis
- Demander une clarification si la demande est ambiguë
- Proposer de transférer à un humain si tu ne peux pas aider (réponds alors exactement "HANDOFF_REQUIRED" seul sur sa ligne, puis ta réponse)
- Si la base de connaissances est vide ou insuffisante pour répondre à la question, réponds : "Je vais transférer votre demande à notre équipe qui vous contactera très bientôt. 🙏"
- Détecter les demandes urgentes et les signaler (réponds alors "URGENT: [ta réponse]")
- Collecter le nom et le téléphone du client si c'est un premier contact et s'il n'est pas encore identifié
- Si quelqu'un envoie une localisation GPS, propose de le guider vers l'entreprise

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

        const text = completion.choices[0]?.message?.content ?? "Je suis désolé, je ne peux pas répondre pour le moment.";
        const totalTokens = completion.usage?.total_tokens ?? 0;
        const isFallback = text.includes('HANDOFF_REQUIRED') || text.toLowerCase().includes('transférer votre demande');
        return { text, totalTokens, isFallback };
    }

    async scrapeAndExtract(url: string): Promise<{ title: string; content: string; category: string }[]> {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IvoireAgentsBot/1.0)' },
        });
        const $ = cheerio.load(response.data as string);
        // Remove noise
        $('script, style, noscript, nav, footer, header, iframe, [aria-hidden]').remove();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);
        if (!bodyText) return [];
        return this.extractKnowledgeFromText(bodyText);
    }

    async generateFaqs(agentId: string, companyId: string, kbService: any): Promise<{ title: string; content: string; category: string }[]> {
        const knowledge = await kbService.getFormattedKnowledge(agentId, companyId);
        if (knowledge === 'Aucune information disponible.') return [];

        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu es un expert en service client. À partir de la base de connaissances fournie, génère des questions fréquentes (FAQ) pertinentes et leurs réponses précises.
Retourne UNIQUEMENT un JSON valide : un tableau d'objets { "title": "question", "content": "réponse", "category": "faq" }.
Pas de markdown, pas d'explication, juste le JSON.`,
                },
                {
                    role: 'user',
                    content: `Base de connaissances:\n${knowledge}\n\nGénère jusqu'à 30 questions-réponses pertinentes pour les clients de cette entreprise.`,
                },
            ],
            max_tokens: 3000,
            temperature: 0.4,
        });

        try {
            const raw = completion.choices[0]?.message?.content ?? '[]';
            const cleaned = raw.replace(/```json|```/g, '').trim();
            return JSON.parse(cleaned);
        } catch {
            return [];
        }
    }

    async extractKnowledgeFromText(rawText: string): Promise<{ title: string; content: string; category: string }[]> {
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu es un assistant qui extrait des informations structurées depuis un texte brut (conversation WhatsApp, description Facebook, catalogue, etc.) pour alimenter la base de connaissances d'un agent IA d'entreprise.
Retourne UNIQUEMENT un JSON valide : un tableau d'objets avec les champs : title (string), content (string), category (une de : product, service, price, schedule, address, faq, delivery, payment, contact, other).
Pas de markdown, pas d'explication, juste le JSON.`,
                },
                {
                    role: 'user',
                    content: `Extrais toutes les informations utiles depuis ce texte :\n\n${rawText.slice(0, 4000)}`,
                },
            ],
            max_tokens: 2000,
            temperature: 0.2,
        });

        try {
            const raw = completion.choices[0]?.message?.content ?? '[]';
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }
}
