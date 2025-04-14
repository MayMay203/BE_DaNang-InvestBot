import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDTO {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(20, { message: 'Password must be less than 20 characters' })
  password: string;

  @MinLength(6, { message: 'Confirm password must be at least 6 characters' })
  @MaxLength(20, {
    message: 'Confirm password must be less than 20 characters',
  })
  confirmPassword: string;

  @IsOptional()
  @IsNumber()
  roleId: number | null;
}
