import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDTO {
  @IsString()
  @MinLength(6)
  newPassword: string;

  @IsString()
  @MinLength(6)
  confirmPassword: string;
}
