import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RoleModule } from './modules/role/role.module';
import { Account } from './entities/account.entity';
import { AuthMiddleware } from './middleware/auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { AccountModule } from './modules/account/account.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    AccountModule,
    RoleModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT') || '3306'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [Account, Role],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, JwtService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: '/', method: RequestMethod.GET },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/resend-otp', method: RequestMethod.POST },
        { path: 'auth/verify-otp', method: RequestMethod.POST },
        { path: 'auth/forget-password', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
