import { IsString, MinLength, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^\+\d{1,3}\d{6,14}$/, {
    message: 'Phone number must be in international format',
  })
  phone: string;

  @IsString()
  @Length(6, 6)
  otp: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
