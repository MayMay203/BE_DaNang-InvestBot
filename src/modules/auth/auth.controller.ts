import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { Response } from 'express';
import { RegisterDTO } from 'src/DTO/register.dto';
import { LoginDTO } from 'src/DTO/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(
    @Body(new ValidationPipe()) body: RegisterDTO,
    @Res() res: Response,
  ) {
    const { email, fullName, password, confirmPassword, roleId } = body;

    // check match password
    if (password !== confirmPassword) {
      throw new HttpException(
        'Password and confirmPassword do not match',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.authService.register(email, fullName, password, roleId);
      return res
        .status(201)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.CREATED,
            MessageHTTP.CREATED,
          ),
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

  @Post('/login')
  async login(
    @Body(new ValidationPipe()) body: LoginDTO,
    @Res() res: Response,
  ) {
    try {
      const { email, password } = body;
      const userLogin = await this.authService.login(email, password);
      console.log(userLogin);
      return res
        .status(200)
        .json(
          new ResponseData<object>(
            userLogin,
            StatusCodeHTTP.SUCCESS,
            MessageHTTP.SUCCESS,
          ),
        );
    } catch (error) {
      return res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error.message,
          ),
        );
    }
  }
}
