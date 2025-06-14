import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/entities/account.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../email/email.service';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    private readonly emailService: EmailService,
  ) { }

  async getAllAccount() {
    return (
      await this.accountRepository.find({
        where: { verified: true },
        relations: ['role'],
      })
    ).reverse();
  }

  async changeStatusAccount(
    id: number,
    status: boolean,
    reason: string | undefined,
    i18n: I18nContext,
  ) {
    const user = await this.accountRepository.findOne({ where: { id } });
    if (user) {
      try {
        if (status === true) {
          reason = '';
          await this.emailService.unlockAccount(user.email, i18n);
        } else {
          await this.emailService.lockAccount(user.email, reason || '', i18n);
        }
        await this.accountRepository.update(
          { id },
          { isActive: status, reason },
        );
        return 'Update account successfully!';
      } catch (error) {
        throw new Error('Update account unsuccessfully');
      }
    }
  }

  async registerAccount(
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
      relations: ['role'],
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
      verified: roleId === 1 || 3 ? true : false,
      role: { id: roleId || defaultRole },
    });

    return await this.accountRepository.save(newUser);
  }
}
