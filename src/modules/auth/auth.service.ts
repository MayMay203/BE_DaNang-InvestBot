import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/entities/account.entity';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  private async addDefaultAdminAcc() {
    const adminAcc = await this.accountRepository.findOne({
      where: { role: { id: 1 } },
    });
    if (!adminAcc) {
      await this.register('admininvestbot@gmail.com', 'admin', 'admin123', 1);
    }
  }

  async onModuleInit() {
    await this.addDefaultAdminAcc();
  }

  async register(
    email: string,
    fullName: string,
    password: string,
    roleId: number | null,
  ) {
    // check existed account
    const existedAcc = await this.accountRepository.findOne({
      where: {
        email,
      },
    });
    if (existedAcc && !existedAcc?.verified)
      throw new Error('Email has registered but not yet verified');
    if (existedAcc) throw new Error('Email has registered');
    // handle OTP
    let OTP = ((Math.random() * 1000000) | 0).toString().padStart(6, '0');
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 2);

    // hash password
    const saltOrRounds = 10;
    const hashedPass = await bcrypt.hash(password, saltOrRounds);

    const defaultRole = 2;
    const newUser = this.accountRepository.create({
      email,
      fullName,
      password: hashedPass,
      OTP,
      expiredAt,
      verified: roleId === 1 ? true : false,
      role: { id: roleId || defaultRole },
    });

    await this.emailService.sendOTP(email, OTP);
    return await this.accountRepository.save(newUser);
  }

  async login(email: string, password: string) {
    const user = await this.accountRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user || !user.verified)
      throw new Error('Email has not been registered');
    const isTrue = await bcrypt.compare(password, user.password);
    if (!isTrue) throw new Error('Password or email is not true');
    else {
      const payload = { id: user.id, email, roleId: user.role.id };
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      });
      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '7d',
      });
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: user.role.id,
        accessToken,
        refreshToken,
      };
    }
  }
}
