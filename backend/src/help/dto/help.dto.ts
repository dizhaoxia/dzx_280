import { IsEnum, IsString, IsOptional, IsNumber, Min, IsInt, isEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { HelpType, HelpCategory, UrgencyLevel, HelpStatus } from '../entities/help-post.entity';
import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';

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
  @Type(() => Number)
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
  @Type(() => Number)
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
  @Transform(({ value }) => {
    if (!value) return undefined;
    const values = String(value).split(',').filter(Boolean);
    const validCategories = Object.values(HelpCategory);
    for (const v of values) {
      if (!validCategories.includes(v as HelpCategory)) {
        throw new BadRequestException(
          `category must be one of the following values: ${validCategories.join(', ')}`
        );
      }
    }
    return values as HelpCategory[];
  })
  category?: HelpCategory[];

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  buildingId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}

export class UpdateHelpStatusDto {
  @IsEnum(HelpStatus)
  status: HelpStatus;
}
