import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async use(req: any, res: any, next: (error?: any) => void) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException(
        this.i18n.translate('common.access_token_missing'),
      );
    }

    try {
      const isRefresh = req.originalUrl.includes('/auth/refresh-token');
      const secret = isRefresh
        ? process.env.JWT_REFRESH_SECRET
        : process.env.JWT_ACCESS_SECRET;

      const payload = this.jwtService.verify(token, { secret });

      req.user = payload;

      if (!payload.isActive) {
        throw new BadRequestException(
          this.i18n.translate('common.account_blocked'),
        );
      }

      if (this.isAdminRoute(req.originalUrl)) {
        if (req.user.roleId !== 1) {
          throw new ForbiddenException(
            this.i18n.translate('common.admin_required'),
          );
        }
      }

      next();
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  private isAdminRoute(url: string): boolean {
    const excludedRoutes = ['/material/save-url-material'];
    if (excludedRoutes.some((route) => url.startsWith(route))) {
      return false;
    }

    const adminRoutes = ['/manage-account', '/material', '/knowledge-store', '/conversation/get-conversations-by-account'];
    return adminRoutes.some((route) => url.startsWith(route));
  }
}
