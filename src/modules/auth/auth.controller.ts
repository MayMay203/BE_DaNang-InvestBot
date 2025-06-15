import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { Response } from 'express';
import { RegisterDTO } from 'src/DTO/auth/register.dto';
import { LoginDTO } from 'src/DTO/auth/login.dto';
import { VerifyOtpDTO } from 'src/DTO/auth/verifyOTP';
import { EmailDTO } from 'src/DTO/auth/email.dto';
import { ResetPasswordDTO } from 'src/DTO/auth/resetPassword.dto';
import { ChangePasswordDTO } from 'src/DTO/auth/changePassword.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/register')
  async register(
    @Body(new ValidationPipe()) body: RegisterDTO,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    const { email, fullName, password, confirmPassword, roleId } = body;

    // check match password
    if (password !== confirmPassword) {
      throw new HttpException(
        i18n.t('common.not_match_password'),
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const message = await this.authService.register(
        email,
        fullName,
        password,
        roleId,
        i18n,
      );
      return res
        .status(201)
        .json(
          new ResponseData<null>(null, StatusCodeHTTP.CREATED, message || ''),
        );
    } catch (error) {
      return res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error.message || 'An error occurred',
          ),
        );
    }
  }

  @Post('/login')
  async login(
    @Body(new ValidationPipe()) body: LoginDTO,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { email, password } = body;
      const userLogin = await this.authService.login(email, password, i18n);
      return res
        .status(200)
        .json(
          new ResponseData<object>(
            userLogin,
            StatusCodeHTTP.SUCCESS,
            MessageHTTP.SUCCESS,
          ),
        );
    } catch (error) {
      return res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error.message,
          ),
        );
    }
  }

  @Post('/verify-otp')
  async verifyOTP(
    @Body(new ValidationPipe()) body: VerifyOtpDTO,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { email, otp } = body;
      const message = await this.authService.verifyOTP(email, otp, i18n);
      res
        .status(200)
        .json(
          new ResponseData<string>(
            message,
            StatusCodeHTTP.SUCCESS,
            MessageHTTP.SUCCESS,
          ),
        );
    } catch (error) {
      res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error.message,
          ),
        );
    }
  }

  @Post('resend-otp')
  async resendOTP(
    @Query(new ValidationPipe()) query: EmailDTO,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { email } = query;
      await this.authService.resendOTP(email, i18n);
      res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.SUCCESS,
            'Check your email to verify OTP',
          ),
        );
    } catch (error) {
      res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error.message,
          ),
        );
    }
  }

  @Post('forget-password')
  async forgetPassword(
    @Query(new ValidationPipe()) query: EmailDTO,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { email } = query;
      await this.authService.forgetPassword(email, i18n);
      res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            'Check your email to verify OTP',
          ),
        );
    } catch (error) {
      res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error.message,
          ),
        );
    }
  }

  @Post('reset-password')
  async resetPassword(
    @Body(new ValidationPipe()) body: ResetPasswordDTO,
    @Req() req: any,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { id } = req.user;
      const { newPassword, confirmPassword } = body;
      if (newPassword !== confirmPassword)
        res
          .status(400)
          .json(
            new ResponseData<null>(
              null,
              StatusCodeHTTP.BAD_REQUEST,
              'The password is not match the confirmPassword',
            ),
          );
      else {
        await this.authService.resetPassword(id, newPassword, i18n);
        res
          .status(200)
          .json(
            new ResponseData<null>(
              null,
              StatusCodeHTTP.SUCCESS,
              'Reset password successfully',
            ),
          );
      }
    } catch (error) {
      res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error.message,
          ),
        );
    }
  }

  @Post('change-password')
  async changePassword(
    @Body(new ValidationPipe()) body: ChangePasswordDTO,
    @Req() req: any,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    const { id } = req.user;
    const { currentPassword, newPassword, confirmPassword } = body;
    if (newPassword !== confirmPassword) {
      res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            'The password is not match the confirmPassword',
          ),
        );
    } else {
      try {
        await this.authService.changePassword(
          id,
          currentPassword,
          newPassword,
          i18n,
        );
        res
          .status(200)
          .json(
            new ResponseData<null>(
              null,
              StatusCodeHTTP.SUCCESS,
              'Change password successfully',
            ),
          );
      } catch (error) {
        res
          .status(400)
          .json(
            new ResponseData<null>(
              null,
              StatusCodeHTTP.BAD_REQUEST,
              error.message,
            ),
          );
      }
    }
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: any, @Res() res: Response) {
    const user = req.user;
    const result = await this.authService.refreshToken(user);
    res
      .status(200)
      .json(
        new ResponseData<object>(
          result,
          StatusCodeHTTP.SUCCESS,
          'Refresh token successfully',
        ),
      );
  }

  // Login with google
  @Get('login-with-google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Switch to google to login
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    // Return user information
    try {
      const token = await this.authService.loginWithGoogle(req.user);
      res.redirect(
        `${process.env.CLIENT_URL}/oauth-success?accessToken=${token.accessToken}&refreshToken=${token.refreshToken}`,
      );
    } catch (error) {
      res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error.message,
          ),
        );
    }
  }
}
