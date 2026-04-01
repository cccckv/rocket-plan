import { IsString, Matches, IsEnum, IsOptional } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^\+\d{1,3}\d{6,14}$/, {
    message: 'Phone number must be in international format (e.g., +8613800138000)',
  })
  phone: string;

  @IsOptional()
  @IsEnum(['login', 'register', 'reset'])
  purpose?: 'login' | 'register' | 'reset';
}
