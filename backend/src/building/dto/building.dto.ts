import { IsString, IsOptional, Length, IsBoolean } from 'class-validator';

export class CreateBuildingDto {
  @IsString()
  @Length(1, 50)
  code: string;

  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateBuildingDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
