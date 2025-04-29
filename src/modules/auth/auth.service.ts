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
      where: {
        role: { id: 1 },
      },
      relations: ['role'],
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
      relations: ['role'],
    });
    if (existedAcc && !existedAcc?.verified)
      return 'Email has registered but not yet verified';
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
    await this.accountRepository.save(newUser);
    return 'Please check your email to enter OTP';
  }

  async login(email: string, password: string) {
    const user = await this.accountRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user || !user.verified)
      throw new Error('Email has not been registered');
    const isTrue = await bcrypt.compare(password, user.password);
    if (!isTrue) throw new Error('Password or email is incorrect');
    else {
      const payload = {
        id: user.id,
        fullName: user.fullName,
        email,
        roleId: user.role.id,
      };
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      });
      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
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

  async verifyOTP(email: string, otp: string) {
    const user = await this.accountRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user) throw new Error('Email has not been registered');
    else {
      if (user.OTP !== otp) {
        throw new Error('The OTP you entered is incorrect');
      } else if (new Date() > user.expiredAt) {
        throw new Error('The OTP has expired');
      } else {
        this.accountRepository.update(user.id, { verified: true });
        return 'OTP verification successful';
      }
    }
  }

  async resendOTP(email: string) {
    const OTP = ((Math.random() * 1000000) | 0).toString().padStart(6, '0');
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 2);
    this.accountRepository.update({ email }, { OTP, expiredAt });
    await this.emailService.sendOTP(email, OTP);
  }

  async forgetPassword(email: string) {
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
      };
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      });
      console.log(accessToken);
      const linkURL = `http://localhost:3000/reset-password?secret=${accessToken}`;
      await this.emailService.forgetPassword(email, linkURL);
    } else {
      throw new Error('Email has not been registered');
    }
  }

  async resetPassword(id: number, password: string) {
    const user = await this.accountRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (user) {
      const saltOrRounds = 10;
      const hashedPass = await bcrypt.hash(password, saltOrRounds);
      await this.accountRepository.update(user.id, { password: hashedPass });
    } else {
      throw new Error('Email has not been registered');
    }
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.accountRepository.findOne({ where: { id } });
    if (user) {
      const isMatch = await bcrypt.compare(currentPassword, user?.password);
      if (!isMatch) throw new Error('Password is incorrect');
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
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });
    return {
      ...payload,
      accessToken,
    };
  }
}
