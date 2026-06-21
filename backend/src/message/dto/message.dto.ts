import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @IsNumber()
  receiverId: number;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsString()
  content: string;
}

export class GetMessagesDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number;
}

export class MarkReadDto {
  @IsNumber()
  conversationId: number;
}
