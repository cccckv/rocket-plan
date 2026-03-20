import { IsString, IsEmail, MinLength, Length } from 'class-validator';

export class ResetPasswordEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  otp: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
