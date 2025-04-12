import { Get, Injectable } from '@nestjs/common';
@Injectable()
export class AuthService {
  @Get()
  detailAccount(): string {
    return 'detailAccount';
  }
}
