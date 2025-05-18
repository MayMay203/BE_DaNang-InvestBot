import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/entities/account.entity';
import { DeepPartial, Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { I18nContext } from 'nestjs-i18n';
import { UserGoogleDTO } from 'src/DTO/auth/userGoogle.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async addDefaultAdminAcc(i18n: I18nContext | null) {
    const adminAcc = await this.accountRepository.findOne({
      where: {
        role: { id: 1 },
      },
      relations: ['role'],
    });
    if (!adminAcc) {
      await this.register(
        'admininvestbot@gmail.com',
        'admin',
        'Admin123@@',
        1,
        i18n,
      );
    }
  }
  async register(
    email: string,
    fullName: string,
    password: string,
    roleId: number | null,
    i18n: I18nContext | null,
  ) {
    // check existed account
    const existedAcc = await this.accountRepository.findOne({
      where: {
        email,
      },
      relations: ['role'],
    });
    if (existedAcc && !existedAcc?.verified) {
      return i18n?.t('common.not_verified_email');
    }
    if (existedAcc) {
      const message = i18n?.t('common.registered_email');
      throw new Error(message);
    }
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

    if (roleId != 1) await this.emailService.sendOTP(email, OTP, i18n);
    await this.accountRepository.save(newUser);
    return i18n?.t('common.message_enter_OTP') as string;
  }

  async login(email: string, password: string, i18n: I18nContext) {
    const user = await this.accountRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user || !user.verified)
      throw new Error(i18n.t('common.not_registered_email'));

    if (!user.isActive) throw new Error(i18n.t('common.locked_account'));

    const isTrue = await bcrypt.compare(password, user.password);
    if (!isTrue) {
      const message = (await i18n.t(
        'common.incorrect_email_and_password',
      )) as string;
      throw new Error(message);
    } else {
      const payload = {
        id: user.id,
        fullName: user.fullName,
        email,
        roleId: user.role.id,
        isActive: user.isActive,
      };
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '1h',
      });
      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '1d',
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

  async verifyOTP(email: string, otp: string, i18n: I18nContext) {
    const user = await this.accountRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user) {
      const message = i18n.t('common.email_not_registered');
      throw new Error(message);
    } else {
      if (user.OTP !== otp) {
        throw new Error(i18n.t('common.incorrect_OTP'));
      } else if (new Date() > user.expiredAt) {
        throw new Error(i18n.t('common.expired_OTP'));
      } else {
        this.accountRepository.update(user.id, { verified: true });
        return i18n.t('common.verified_success_OTP');
      }
    }
  }

  async resendOTP(email: string, i18n: I18nContext) {
    const OTP = ((Math.random() * 1000000) | 0).toString().padStart(6, '0');
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 2);
    this.accountRepository.update({ email }, { OTP, expiredAt });
    await this.emailService.sendOTP(email, OTP, i18n);
  }

  async forgetPassword(email: string, i18n: I18nContext) {
    const user = await this.accountRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (user) {
      const payload = {
        id: user.id,
        fullName: user.fullName,
        email,
        roleId: user.role.id,
        isActive: user.isActive,
      };
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '5m',
      });
      const linkURL = `http://localhost:3000/reset-password?secret=${accessToken}`;
      await this.emailService.forgetPassword(email, linkURL, i18n);
    } else {
      throw new Error(i18n.t('common.not_registered_email'));
    }
  }

  async resetPassword(id: number, password: string, i18n: I18nContext) {
    const user = await this.accountRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (user) {
      const saltOrRounds = 10;
      const hashedPass = await bcrypt.hash(password, saltOrRounds);
      await this.accountRepository.update(user.id, { password: hashedPass });
    } else {
      throw new Error(i18n.t('common.not_registered_email'));
    }
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
    i18n: I18nContext,
  ) {
    const user = await this.accountRepository.findOne({ where: { id } });
    if (user) {
      const isMatch = await bcrypt.compare(currentPassword, user?.password);
      if (!isMatch) throw new Error(i18n.t('common.incorrect_password'));
      else {
        const saltOrRounds = 10;
        const newPass = await bcrypt.hash(newPassword, saltOrRounds);
        await this.accountRepository.update(id, { password: newPass });
      }
    }
  }

  async refreshToken(user: any) {
    const payload = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '30s',
    });
    return {
      ...payload,
      accessToken,
    };
  }

  async loginWithGoogle(user: UserGoogleDTO) {
    const userInfo = await this.accountRepository.findOne({
      where: { email: user.email },
      relations: ['role'],
    });
    if (!userInfo) {
      const expiredAt = new Date();
      expiredAt.setMinutes(expiredAt.getMinutes() + 2);

      const newUser = this.accountRepository.create({
        email: user.email,
        fullName: `${user.lastName} ${user.firstName}`,
        password: '',
        OTP: '',
        expiredAt,
        verified: true,
        role: { id: 2 },
      });

      const savedUser = await this.accountRepository.save(newUser);
      return savedUser;
    }
    return userInfo;
  }
}
