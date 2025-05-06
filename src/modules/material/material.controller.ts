import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { ChangeStatusDTO } from 'src/DTO/account/changeStatus.dto';

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

  @Get('/get-all-materials')
  async getAllMaterials(@Res() res: Response) {
    try {
      const materials = await this.materialService.getAllMaterials();
      return res
        .status(200)
        .json(
          new ResponseData<Array<Object>>(
            materials,
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
            error.message || 'An error occurred',
          ),
        );
    }
  }

  @Get('/:id')
  async getDetailMaterial(@Res() res: Response, @Param('id') id: number) {
    try {
      const material = await this.materialService.getDetailMeterial(id);
      return res
        .status(200)
        .json(
          new ResponseData<Array<Object>>(
            material,
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
            error.message || 'An error occurred',
          ),
        );
    }
  }

  @Patch('/update-material/:id')
  async updateMaterial(
    @Res() res: Response,
    @Param('id') id: number,
    @Body() body: MaterialDTO,
  ) {
    try {
      const { name, description, text, url } = body;
      const material = await this.materialService.updateMaterial(
        id,
        name || '',
        description || '',
        text || '',
        url || '',
      );
      return res
        .status(200)
        .json(
          new ResponseData<Object>(
            material || {},
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
            error.message || 'An error occurred',
          ),
        );
    }
  }

  @Patch('/change-status')
  async changeStatusMaterial(
    @Body() body: ChangeStatusDTO,
    @Res() res: Response,
  ) {
    try {
      const { id, status } = body;
      await this.materialService.changeStatus(id, status);
      return res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.SUCCESS,
            'Update status successfully',
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
