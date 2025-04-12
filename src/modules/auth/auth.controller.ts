import { Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/login')
  login(): string {
    return 'login';
  }

  @Post()
  logout(): string {
    return 'logout';
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
