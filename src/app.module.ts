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
import { AccessLevel } from './entities/accessLevel.entity';
import { Conversation } from './entities/conversation.entity';
import { KnowledgeStore } from './entities/knowledgeStore.entity';
import { Material } from './entities/material.entity';
import { MaterialType } from './entities/materialType.entity';
import { QuestionAnswer } from './entities/questionAnswer.entity';
import { AccessLevelModule } from './modules/accessLevel/accessLevel.module';
import { MaterialTypeModule } from './modules/materialType/materialType.module';
import { SeederModule } from './modules/seeder/seeder.module';
import { MaterialModule } from './modules/material/material.module';
import { KnowledgeStoreModule } from './modules/knowledgeStore/knowledgeStore.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    AccountModule,
    RoleModule,
    AccessLevelModule,
    MaterialTypeModule,
    MaterialModule,
    SeederModule,
    KnowledgeStoreModule,
    ConversationModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT') || '3306'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [
          Account,
          Role,
          AccessLevel,
          Conversation,
          KnowledgeStore,
          Material,
          MaterialType,
          QuestionAnswer,
        ],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: path.join(__dirname, '../src/i18n'),
        watch: true,
      },
      resolvers: [{ use: HeaderResolver, options: ['accept-language'] }],
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
