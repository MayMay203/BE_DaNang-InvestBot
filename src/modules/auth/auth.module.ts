import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/entities/account.entity';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([Account]),PassportModule],
  controllers: [AuthController],
  providers: [AuthService, EmailService, JwtService, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
