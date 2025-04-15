import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}
  use(req: any, res: any, next: (error?: any) => void) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1]; // Bearer <token>
    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }
    try {
      const isRefresh = req.originalUrl.includes('/auth/refresh-token');
      const secret = isRefresh
        ? process.env.JWT_REFRESH_SECRET
        : process.env.JWT_ACCESS_SECRET;
      const payload = this.jwtService.verify(token, { secret });

      req.user = payload;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
