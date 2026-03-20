import { IsString, IsEmail, IsOptional } from 'class-validator';

export class GoogleLoginDto {
  @IsString()
  googleId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;
}
