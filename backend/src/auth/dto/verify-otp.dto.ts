import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+\d{1,3}\d{6,14}$/, {
    message: 'Phone number must be in international format (e.g., +8613800138000)',
  })
  phone: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
