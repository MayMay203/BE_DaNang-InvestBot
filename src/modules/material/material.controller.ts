import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialDTO } from 'src/DTO/material/material.dto';
import { Response } from 'express';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Post('/upload-material')
  @UseInterceptors(FileInterceptor('file'))
  async addMaterial(
    @Body(new ValidationPipe()) body: MaterialDTO,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (Number(body.materialTypeId) === 1 && !file) {
        return res
          .status(400)
          .json(
            new ResponseData<null>(
              null,
              StatusCodeHTTP.BAD_REQUEST,
              'File is required',
            ),
          );
      }
      const data = await this.materialService.addMaterial(body, file);
      return res
        .status(201)
        .json(
          new ResponseData<object>(
            data,
            StatusCodeHTTP.CREATED,
            MessageHTTP.CREATED,
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
