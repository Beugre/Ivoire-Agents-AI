import { IsString, IsOptional, IsEnum, IsObject, IsBoolean, MaxLength } from 'class-validator';
import { AgentRole, AgentTone, AgentLanguage } from '../entities/agent.entity';

export class CreateAgentDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsEnum(AgentRole)
    role: AgentRole;

    @IsEnum(AgentTone)
    tone: AgentTone;

    @IsEnum(AgentLanguage)
    language: AgentLanguage;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    welcomeMessage?: string;

    @IsString()
    @IsOptional()
    @MaxLength(3000)
    customInstructions?: string;

    @IsObject()
    @IsOptional()
    availabilitySchedule?: Record<string, { start: string; end: string }>;
}
