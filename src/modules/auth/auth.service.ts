import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/entities/account.entity';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    private emailService: EmailService,
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
}
