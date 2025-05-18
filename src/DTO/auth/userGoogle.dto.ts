import { IsEmail, IsString } from 'class-validator';

export class UserGoogleDTO {
  @IsString()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}
