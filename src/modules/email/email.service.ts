import { Injectable } from '@nestjs/common';
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
  async sendOTP(email: string, otp: string) {
    const mailOptions = {
      from: 'hongnhung16052003@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error('Could not send OTP');
    }
  }

  // Gửi email để resetpassword
  async forgetPassword(email: string, url: string) {
    const mailOptions = {
      from: 'hongnhung16052003@gmail.com',
      to: email,
      subject: 'Reset your password',
      text: `Click this link to reset: ${url}`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error('Could not forget password');
    }
  }
}
