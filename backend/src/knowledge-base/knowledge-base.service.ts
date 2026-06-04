import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeBaseItem } from './entities/knowledge-base-item.entity';
import { KbSuggestion } from './entities/kb-suggestion.entity';
import { CreateKbItemDto } from './dto/create-kb-item.dto';

@Injectable()
export class KnowledgeBaseService {
    constructor(
        @InjectRepository(KnowledgeBaseItem)
        private readonly kbRepository: Repository<KnowledgeBaseItem>,
        @InjectRepository(KbSuggestion)
        private readonly suggestionRepository: Repository<KbSuggestion>,
    ) { }

    async create(dto: CreateKbItemDto, companyId: string): Promise<KnowledgeBaseItem> {
        const item = this.kbRepository.create({ ...dto, companyId });
        return this.kbRepository.save(item);
    }

    async findByAgent(agentId: string, companyId: string): Promise<KnowledgeBaseItem[]> {
        return this.kbRepository.find({
            where: { agentId, companyId },
            order: { category: 'ASC', createdAt: 'DESC' },
        });
    }

    async findByCompany(companyId: string): Promise<KnowledgeBaseItem[]> {
        return this.kbRepository.find({
            where: { companyId },
            order: { createdAt: 'DESC' },
        });
    }

    async update(id: string, companyId: string, data: Partial<KnowledgeBaseItem>): Promise<KnowledgeBaseItem> {
        const item = await this.kbRepository.findOne({ where: { id, companyId } });
        if (!item) throw new NotFoundException('Élément introuvable');
        Object.assign(item, data);
        return this.kbRepository.save(item);
    }

    async remove(id: string, companyId: string): Promise<void> {
        const item = await this.kbRepository.findOne({ where: { id, companyId } });
        if (!item) throw new NotFoundException('Élément introuvable');
        await this.kbRepository.remove(item);
    }

    async getFormattedKnowledge(agentId: string, companyId: string): Promise<string> {
        const items = await this.findByAgent(agentId, companyId);
        if (items.length === 0) return 'Aucune information disponible.';
        return items
            .map((item) => `[${item.category.toUpperCase()}] ${item.title}:\n${item.content}`)
            .join('\n\n');
    }

    async testAgentAnswer(agentId: string, companyId: string, question: string, aiService: any, persona?: string): Promise<{ answer: string }> {
        const knowledge = await this.getFormattedKnowledge(agentId, companyId);
        const personaInstructions: Record<string, string> = {
            difficult: "Tu simules un client difficile et exigeant qui n'est jamais satisfait, conteste les informations et se plaint fréquemment.",
            pressed: "Tu simules un client très pressé qui veut des réponses ultra-courtes et immédiates. Il est impatient et peu tolérant aux explications longues.",
            negotiator: "Tu simules un client qui négocie systématiquement les prix, cherche des remises, compare avec la concurrence et veut des avantages.",
        };
        const fakeAgent = {
            name: 'Assistant IA',
            role: 'Répondre aux questions sur l\'entreprise',
            tone: 'professional',
            language: 'french',
            customInstructions: persona && personaInstructions[persona] ? `[CONTEXTE TEST - Persona client simulé]: ${personaInstructions[persona]}` : null,
        } as any;
        const result = await aiService.generateReply(fakeAgent, '', knowledge, [], question);
        return { answer: typeof result === 'string' ? result : result.text };
    }

    // #36 — Suggestions KB
    async createSuggestion(companyId: string, agentId: string, question: string, suggestedAnswer: string, sourceConversationId?: string): Promise<KbSuggestion> {
        const existing = await this.suggestionRepository.findOne({ where: { companyId, question } });
        if (existing) return existing;
        const s = this.suggestionRepository.create({ companyId, agentId, question, suggestedAnswer, sourceConversationId });
        return this.suggestionRepository.save(s);
    }

    async getSuggestions(companyId: string): Promise<KbSuggestion[]> {
        return this.suggestionRepository.find({
            where: { companyId, approvedAt: undefined as any },
            order: { createdAt: 'DESC' },
            take: 20,
        });
    }

    async approveSuggestion(id: string, companyId: string): Promise<KnowledgeBaseItem> {
        const s = await this.suggestionRepository.findOne({ where: { id, companyId } });
        if (!s) throw new NotFoundException('Suggestion introuvable');
        s.approvedAt = new Date();
        await this.suggestionRepository.save(s);
        return this.create({ title: s.question, content: s.suggestedAnswer, category: 'faq', agentId: s.agentId } as CreateKbItemDto, companyId);
    }

    async deleteSuggestion(id: string, companyId: string): Promise<void> {
        const s = await this.suggestionRepository.findOne({ where: { id, companyId } });
        if (!s) throw new NotFoundException('Suggestion introuvable');
        await this.suggestionRepository.remove(s);
    }
}
