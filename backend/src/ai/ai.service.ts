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
        "Adopte un ton ivoirien authentique et chaleureux. Tu comprends et parles le nouchi, mais tu utilises du FRANÇAIS CORRECT par défaut. Tu passes en nouchi UNIQUEMENT si le client t'écrit en nouchi en premier. Quand tu utilises le nouchi, préfère des expressions naturelles comme 'c'est comment ?' (et non 'sava frê'), 'on dit quoi ?', 'ça va aller', 'c'est bon même', 'je vous entends'. Reste proche et chaleureux sans forcer le style.",
    [AgentTone.FORMAL]:
        'Sois très formel, utilise le vouvoiement systématiquement.',
    [AgentTone.FRIENDLY]:
        "Sois décontracté, sympa et proche du client comme un ami qui aide.",
};

const CI_CONTEXT = `
CONTEXTE CÔTE D'IVOIRE — RÈGLES IMPORTANTES :
- Tu opères en Côte d'Ivoire. Les prix sont en FCFA (Francs CFA). Ne mentionne jamais d'euros ou de dollars sauf demande explicite.
- Tu comprends le nouchi (argot ivoirien/abidjanais) : "gbê" = vrai, "gâter" = abîmer, "djo" = personne, "on va kpindé" = on va partir, "ça va" peut s'écrire "sava", "frê" = frère, "zié" = voir/regarder, "décaler" = partir, "go" = femme/fille, "wêwê" = vraiment, "c'est comment ?" = comment ça va ?
- RÈGLE LANGUE : réponds TOUJOURS en français correct et professionnel par défaut.
- EXCEPTION NOUCHI : si le client écrit lui-même en nouchi ou en argot ivoirien, tu peux alors adopter un registre plus familier ivoirien. Même en nouchi, évite les tournures forcées — préfère 'c'est comment ?' à 'sava frê ?', 'on dit quoi ?' à 'gbô frê'.
- Ne force JAMAIS le nouchi si le client écrit en français standard.
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
Langue : ${agent.language === 'ivorian_french' ? "Français ivoirien naturel. Tu passes en nouchi UNIQUEMENT si le client t'écrit en nouchi." : "Français standard"}

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

    async calculateLeadScore(customerMessage: string, recentMessages: string): Promise<number> {
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu es un expert en qualification de prospects B2C en Côte d'Ivoire.
Analyse le message client et attribue un score d'intention d'achat de 0 à 100.
- 0-30 : simple curiosité, pas d'intention claire
- 31-60 : intéressé, pose des questions sur les prix/services
- 61-85 : intention forte (demande de devis, "je veux", "comment commander", "livraison", "disponible ?")
- 86-100 : prêt à acheter maintenant ("je prends", "commande", "paiement", "adresse de livraison")
Réponds UNIQUEMENT avec un entier entre 0 et 100, rien d'autre.`,
                },
                {
                    role: 'user',
                    content: `Dernier message: "${customerMessage}"\n\nContexte récent: ${recentMessages}`,
                },
            ],
            max_tokens: 10,
            temperature: 0.1,
        });
        const raw = completion.choices[0]?.message?.content?.trim() ?? '10';
        const score = parseInt(raw, 10);
        return isNaN(score) ? 10 : Math.min(100, Math.max(0, score));
    }

    async summarizeConversation(messages: { sender: string; content: string }[]): Promise<string> {
        const transcript = messages
            .slice(-20)
            .map((m) => `${m.sender === 'customer' ? 'Client' : 'Agent'}: ${m.content}`)
            .join('\n');

        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu es un assistant commercial en Côte d'Ivoire. Résume cette conversation WhatsApp en 3 lignes max.
Format: 
• Intention: [ce que veut le client]
• Produits/services évoqués: [liste]
• Action suggérée: [ce que l'équipe devrait faire]
Sois concis et actionnable.`,
                },
                { role: 'user', content: `Conversation:\n${transcript}` },
            ],
            max_tokens: 200,
            temperature: 0.3,
        });
        return completion.choices[0]?.message?.content?.trim() ?? 'Résumé non disponible.';
    }

    async generateSectorPack(sector: string, agentId: string, companyId: string, kbService: any): Promise<{ title: string; content: string; category: string }[]> {
        const SECTOR_CONTEXT: Record<string, string> = {
            restaurant: 'plats, menus du jour, boissons, livraison, réservations, horaires, tarifs typiques de restauration à Abidjan',
            salon: 'coiffure, soins, tresses, lissage, massage, manucure, pédicure, épilation, tarifs, durées des prestations',
            boutique: 'vêtements, mode, accessoires, tailles disponibles, livraison, retours, paiement Mobile Money',
            clinique: 'consultations, spécialités médicales, rendez-vous, urgences, analyses, tarifs, horaires, médecins disponibles',
            transport: 'zones desservies, tarifs par kilomètre, réservation, horaires, types de véhicules, bagages',
            immobilier: 'locations, ventes, appartements, villas, studios, prix au m², quartiers, visites, caution',
        };
        const context = SECTOR_CONTEXT[sector.toLowerCase()] ?? `activités et services typiques d'un ${sector}`;

        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu es expert en commerce local en Côte d'Ivoire, spécialisé dans le secteur ${sector}.
Génère un pack complet de données de démonstration pour alimenter la base de connaissances d'un agent IA.
Les données doivent être réalistes pour Abidjan : prix en FCFA, noms ivoiriens, quartiers d'Abidjan, Mobile Money.
Couvre : ${context}.
Retourne UNIQUEMENT un JSON valide : tableau d'objets { "title": string, "content": string, "category": string }.
Les catégories disponibles sont : product, service, price, schedule, address, faq, delivery, payment, contact, other.
Génère 15-25 entrées variées et pertinentes. Pas de markdown, pas d'explication.`,
                },
                {
                    role: 'user',
                    content: `Génère le pack de base de connaissances pour : ${sector} à Abidjan`,
                },
            ],
            max_tokens: 3000,
            temperature: 0.5,
        });

        try {
            const raw = completion.choices[0]?.message?.content ?? '[]';
            const cleaned = raw.replace(/```json|```/g, '').trim();
            const items = JSON.parse(cleaned);
            // Auto-save items to the KB
            const saved: any[] = [];
            for (const item of items) {
                const s = await kbService.create({ ...item, agentId, companyId } as any, companyId);
                saved.push(s);
            }
            return saved;
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

    // #4 — Mode Formation : apprendre une correction Q→R via dialogue
    async trainFromDialogue(question: string, correction: string): Promise<{ title: string; content: string; category: string }> {
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu génères une entrée de base de connaissances à partir d'une correction d'agent IA.
Retourne UNIQUEMENT un JSON valide : { "title": string, "content": string, "category": string }.
Les catégories disponibles : product, service, price, schedule, address, faq, delivery, payment, contact, other.
Pas de markdown, pas d'explication, juste le JSON.`,
                },
                {
                    role: 'user',
                    content: `Question posée au bot : "${question}"\nRéponse correcte à apprendre : "${correction}"\n\nCrée l'entrée KB optimisée.`,
                },
            ],
            max_tokens: 300,
            temperature: 0.2,
        });
        try {
            const raw = completion.choices[0]?.message?.content ?? '{}';
            return JSON.parse(raw.replace(/```json|```/g, '').trim());
        } catch {
            return { title: question.slice(0, 60), content: correction, category: 'faq' };
        }
    }

    // #34 — Relecture contradictions KB
    async checkContradictions(items: { id: string; title: string; content: string }[]): Promise<{ id1: string; id2: string; title1: string; title2: string; reason: string }[]> {
        if (items.length < 2) return [];
        const formatted = items.map((i) => `[${i.id.slice(0, 8)}] ${i.title}: ${i.content.slice(0, 200)}`).join('\n');
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu analyses une base de connaissances pour trouver des contradictions ou incohérences entre les entrées.
Retourne UNIQUEMENT un JSON valide : tableau de { "id1": "debut_uuid", "id2": "debut_uuid", "title1": string, "title2": string, "reason": string }.
Si aucune contradiction, retourne []. Pas de markdown.`,
                },
                {
                    role: 'user',
                    content: `Base de connaissances :\n${formatted}\n\nTrouve les contradictions.`,
                },
            ],
            max_tokens: 800,
            temperature: 0.2,
        });
        try {
            const raw = completion.choices[0]?.message?.content ?? '[]';
            const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
            // Resolve short IDs back to full IDs
            return parsed.map((c: any) => {
                const item1 = items.find((i) => i.id.startsWith(c.id1)) ?? items[0];
                const item2 = items.find((i) => i.id.startsWith(c.id2)) ?? items[1];
                return { id1: item1.id, id2: item2.id, title1: item1.title, title2: item2.title, reason: c.reason };
            });
        } catch {
            return [];
        }
    }

    // #35 — Détection obsolescence KB
    async detectObsolete(items: { id: string; title: string; content: string; createdAt: Date }[]): Promise<{ id: string; title: string; reason: string }[]> {
        if (items.length === 0) return [];
        const formatted = items.map((i) => `[${i.id.slice(0, 8)}] ${i.title}: ${i.content.slice(0, 150)} (ajouté le ${new Date(i.createdAt).toLocaleDateString('fr-FR')})`).join('\n');
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu analyses une base de connaissances pour identifier les entrées potentiellement obsolètes ou à mettre à jour.
Critères : informations de prix pouvant changer, horaires susceptibles d'être modifiés, promotions à durée limitée, informations datées.
Retourne UNIQUEMENT un JSON valide : tableau de { "id": "debut_uuid", "title": string, "reason": string }.
Si aucune entrée obsolète, retourne []. Pas de markdown.`,
                },
                {
                    role: 'user',
                    content: `Entrées KB :\n${formatted}`,
                },
            ],
            max_tokens: 600,
            temperature: 0.2,
        });
        try {
            const raw = completion.choices[0]?.message?.content ?? '[]';
            const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
            return parsed.map((o: any) => {
                const item = items.find((i) => i.id.startsWith(o.id)) ?? items[0];
                return { id: item.id, title: item.title, reason: o.reason };
            });
        } catch {
            return [];
        }
    }

    // #36 — Générer suggestions KB depuis conversations fermées (#36)
    async generateKbSuggestions(conversations: { question: string; answer: string }[]): Promise<{ question: string; suggestedAnswer: string }[]> {
        if (conversations.length === 0) return [];
        const samples = conversations.slice(0, 15).map((c) => `Q: ${c.question}\nR: ${c.answer}`).join('\n\n');
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu analyses des échanges client→agent pour identifier les nouvelles informations à ajouter à la base de connaissances.
Retourne UNIQUEMENT un JSON valide : tableau de { "question": string, "suggestedAnswer": string } pour les échanges utiles et non déjà couverts.
Pas de markdown.`,
                },
                {
                    role: 'user',
                    content: `Échanges récents :\n${samples}`,
                },
            ],
            max_tokens: 1500,
            temperature: 0.3,
        });
        try {
            const raw = completion.choices[0]?.message?.content ?? '[]';
            return JSON.parse(raw.replace(/```json|```/g, '').trim());
        } catch {
            return [];
        }
    }

    // #20 — Segmentation automatique d'un client
    async autoSegmentCustomer(conversations: { content: string; sender: string }[]): Promise<string> {
        if (conversations.length === 0) return 'prospect';
        const transcript = conversations.slice(-20).map((m) => `${m.sender === 'customer' ? 'Client' : 'Agent'}: ${m.content}`).join('\n');
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu segmentes un client en commerce ivoirien selon ses échanges WhatsApp.
Segments possibles (réponds UNIQUEMENT avec l'un de ces mots) :
- prospect : premier contact, simple curiosité, pas encore acheté
- client : a déjà acheté ou a confirmé une commande
- vip : client fidèle, commandes multiples, fort engagement
- inactif : pas de réponse depuis longtemps, conversations fermées sans achat
Réponds avec UN SEUL mot parmi : prospect, client, vip, inactif.`,
                },
                { role: 'user', content: transcript },
            ],
            max_tokens: 10,
            temperature: 0.1,
        });
        const raw = completion.choices[0]?.message?.content?.trim().toLowerCase() ?? 'prospect';
        const valid = ['prospect', 'client', 'vip', 'inactif'];
        return valid.includes(raw) ? raw : 'prospect';
    }
}
