import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @Type(() => Number)
  @IsNumber()
  receiverId: number;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsString()
  content: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;
}

export class GetMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}

export class MarkReadDto {
  @Type(() => Number)
  @IsNumber()
  conversationId: number;
}

export class CreateConversationDto {
  @Type(() => Number)
  @IsNumber()
  targetUserId: number;
}
