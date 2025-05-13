import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { Response } from 'express';
import { ChangeStatusDTO } from 'src/DTO/account/changeStatus.dto';
import { RegisterDTO } from 'src/DTO/auth/register.dto';

@Controller('manage-account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('/get-all-accounts')
  async getAllAccount(@Res() res: Response) {
    const accounts = await this.accountService.getAllAccount();
    return res
      .status(200)
      .json(
        new ResponseData<object>(
          accounts,
          StatusCodeHTTP.SUCCESS,
          MessageHTTP.SUCCESS,
        ),
      );
  }

  @Post('/change-status-account')
  async changeStatusAccount(
    @Body() body: ChangeStatusDTO,
    @Res() res: Response,
  ) {
    try {
      const { id, status, reason } = body;
      const message = await this.accountService.changeStatusAccount(
        id,
        status,
        reason,
      );
      return res
        .status(200)
        .json(new ResponseData<null>(null, StatusCodeHTTP.SUCCESS, message));
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

  @Post('/register-account')
  async registerAccount(
    @Body(new ValidationPipe()) body: RegisterDTO,
    @Res() res: Response,
  ) {
    const { email, fullName, password, confirmPassword, roleId } = body;

    // check match password
    if (password !== confirmPassword) {
      throw new HttpException(
        'Password and confirmPassword do not match',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const user = await this.accountService.registerAccount(
        email,
        fullName,
        password,
        roleId,
      );
      return res
        .status(201)
        .json(
          new ResponseData<object>(
            user,
            StatusCodeHTTP.CREATED,
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
            error.message || 'An error occurred',
          ),
        );
    }
  }
}
