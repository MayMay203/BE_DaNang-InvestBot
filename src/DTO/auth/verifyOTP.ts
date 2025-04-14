import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDTO {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6)
  otp: string;
}
