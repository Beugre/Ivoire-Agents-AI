import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { KBItemCategory } from '../entities/knowledge-base-item.entity';

export class CreateKbItemDto {
    @IsString()
    @MaxLength(200)
    title: string;

    @IsString()
    @MaxLength(5000)
    content: string;

    @IsEnum(KBItemCategory)
    @IsOptional()
    category?: KBItemCategory;

    @IsString()
    agentId: string;
}
