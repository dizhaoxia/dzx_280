import { IsString, Length, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(11, 11, { message: '手机号必须是11位' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsString()
  @Length(6, 20, { message: '密码长度6-20位' })
  password: string;

  @IsOptional()
  @IsString()
  nickname?: string;
}

export class LoginDto {
  @IsString()
  @Length(11, 11, { message: '手机号必须是11位' })
  phone: string;

  @IsString()
  password: string;
}
