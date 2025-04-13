import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { Response } from 'express';

class RegisterDTO {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  roleId?: number;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  private hasMissingFields(
    email: string,
    fullName: string,
    password: string,
    confirmPassword: string,
  ): boolean {
    return !email || !fullName || !password || !confirmPassword;
  }

  @Post('/register')
  async register(@Body() body: RegisterDTO, @Res() res: Response) {
    const { email, fullName, password, confirmPassword, roleId } = body;

    // check input fields
    if (this.hasMissingFields(email, fullName, password, confirmPassword)) {
      throw new HttpException(
        'Missing required fields',
        HttpStatus.BAD_REQUEST,
      );
    }

    // check match password
    if (password !== confirmPassword) {
      throw new HttpException(
        'Password and confirmPassword do not match',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const newUser = await this.authService.register(
        email,
        fullName,
        password,
        roleId,
      );
      return new ResponseData<object>(
        newUser,
        StatusCodeHTTP.CREATED,
        MessageHTTP.CREATED,
      );
    } catch (error) {
      return res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error.message || 'An error occurred',
          ),
        );
    }
  }
}
