import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class SendEmailOtpDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(['register', 'reset'])
  purpose?: 'register' | 'reset';
}
