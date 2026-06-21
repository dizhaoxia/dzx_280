import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemCondition } from '../entities/item.entity';
import { BorrowRequestStatus } from '../entities/borrow-request.entity';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  photos?: string;

  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deposit?: number;

  @IsOptional()
  @IsBoolean()
  isFreeDeposit?: boolean;

  @IsOptional()
  @IsString()
  availableSlots?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  buildingId?: number;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  photos?: string;

  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deposit?: number;

  @IsOptional()
  @IsBoolean()
  isFreeDeposit?: boolean;

  @IsOptional()
  @IsString()
  availableSlots?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class GetItemsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ownerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  buildingId?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;
}

export class CreateBorrowRequestDto {
  @Type(() => Number)
  @IsNumber()
  itemId: number;

  @IsDateString()
  expectedStartDate: string;

  @IsDateString()
  expectedEndDate: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class ProcessBorrowRequestDto {
  @IsEnum(BorrowRequestStatus)
  status: BorrowRequestStatus;

  @IsOptional()
  @IsString()
  rejectReason?: string;
}

export class ReturnItemDto {
  @IsOptional()
  @IsString()
  returnRemark?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualDamageCost?: number;
}

export class GetBorrowRequestsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  itemId?: number;
}

export class GetBorrowRecordsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  itemId?: number;
}
