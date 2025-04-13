import { Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(
    @Query('email') email: string,
    @Query('password') password: string,
  ): string {
    return `${email} : ${password}`;
  }

  @Post('/register')
  register(
    @Query('email') email: string,
    @Query('fullName') fullName: string,
    @Query('password') password: string,
    @Query('cofirmPassword') confirmPassword: string,
  ): string {
    if (password !== confirmPassword) return 'not match';
    return 'match';
  }

  @Get('/:id')
  detailLogin(): ResponseData<string> {
    try {
      return new ResponseData<string>(
        '',
        StatusCodeHTTP.ERROR,
        MessageHTTP.ERROR,
      );
    } catch (error) {
      return new ResponseData<string>(
        this.authService.detailAccount(),
        StatusCodeHTTP.SUCCESS,
        MessageHTTP.SUCCESS,
      );
    }
  }
}
