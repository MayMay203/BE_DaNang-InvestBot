import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/entities/account.entity';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { ResponseData } from 'src/global/globalClass';
import { StatusCodeHTTP } from 'src/global/globalEnum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    private emailService: EmailService,
  ) {}
  async register(email: string, fullName: string, password: string) {
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
    const OTP = ((Math.random() * 1000000) | 0).toString().padStart(6, '0');
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 2);

    // hash password
    const saltOrRounds = 10;
    const hashedPass = await bcrypt.hash(password, saltOrRounds);

    const newUser = this.accountRepository.create({
      email,
      fullName,
      password: hashedPass,
      OTP,
      expiredAt,
    });

    await this.emailService.sendOTP(email, OTP);
    return await this.accountRepository.save(newUser);
  }
}
