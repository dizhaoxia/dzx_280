import { IsString, IsOptional, Length, IsNumber } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class VerifyByPropertyDto {
  @IsString()
  @Length(1, 50)
  propertyCertNo: string;

  @IsNumber()
  buildingId: number;

  @IsString()
  @Length(1, 20)
  roomNo: string;
}

export class UpdateUnreadCountDto {
  @IsNumber()
  count: number;
}
