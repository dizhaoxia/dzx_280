import { IsEnum, IsString, IsOptional, IsNumber, Min, IsInt } from 'class-validator';
import { HelpType, HelpCategory, UrgencyLevel, HelpStatus } from '../entities/help-post.entity';

export class CreateHelpPostDto {
  @IsEnum(HelpType)
  type: HelpType;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(HelpCategory)
  category: HelpCategory;

  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;

  @IsOptional()
  @IsNumber()
  buildingId?: number;

  @IsOptional()
  @IsString()
  locationDetail?: string;

  @IsOptional()
  @IsString()
  images?: string;
}

export class UpdateHelpPostDto {
  @IsOptional()
  @IsEnum(HelpType)
  type?: HelpType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(HelpCategory)
  category?: HelpCategory;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @IsOptional()
  @IsNumber()
  buildingId?: number;

  @IsOptional()
  @IsString()
  locationDetail?: string;

  @IsOptional()
  @IsString()
  images?: string;
}

export class QueryHelpDto {
  @IsOptional()
  @IsEnum(HelpType)
  type?: HelpType;

  @IsOptional()
  @IsEnum(HelpCategory)
  category?: HelpCategory;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsNumber()
  buildingId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}

export class UpdateHelpStatusDto {
  @IsEnum(HelpStatus)
  status: HelpStatus;
}
