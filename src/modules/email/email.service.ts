import { Injectable } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'hongnhung16052003@gmail.com',
        pass: 'ovkszuymlmnbvhnq',
      },
    });
  }

  // Gửi email với OTP
  async sendOTP(email: string, otp: string, i18n: I18nContext | null) {
    const text = i18n?.t('common.your_OTP_code_is') + otp;
    const mailOptions = {
      from: 'hongnhung16052003@gmail.com',
      to: email,
      subject: i18n?.t('common.your_OTP_code'),
      text,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(i18n?.t('common.not_send_OTP'));
    }
  }

  // Gửi email để resetpassword
  async forgetPassword(email: string, url: string, i18n: I18nContext) {
    const text = `${i18n.t('common.click_link_to_reset')}${url}\n\n${i18n.t('common.reset_password_expiry_notice')}`;
    const mailOptions = {
      from: 'hongnhung16052003@gmail.com',
      to: email,
      subject: i18n.t('common.reset_your_password'),
      text,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(i18n.t('common.not_forget_password'));
    }
  }
}
