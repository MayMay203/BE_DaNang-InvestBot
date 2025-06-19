import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialDTO } from 'src/DTO/material/material.dto';
import { Response } from 'express';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChangeStatusDTO } from 'src/DTO/account/changeStatus.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
@Controller('material')
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
    private readonly configService: ConfigService,
  ) { }

  @Post('/add-basic-materials')
  async addBasicMaterials(@Body() data: MaterialDTO[], @Res() res: Response) {
    try {
      await this.materialService.addBasicMaterial(data)
      return res
        .status(201)
        .json(
          new ResponseData<string>(
            'Add basic materials successfully',
            StatusCodeHTTP.CREATED,
            MessageHTTP.CREATED,
          ),
        );
    }
    catch (error) {
      return res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error?.response?.data?.detail ||
            error.message ||
            'An error occurred',
          ),
        );
    }
  }

  @Post('/upload-material')
  @UseInterceptors(FilesInterceptor('files'))
  async addMaterial(
    @Body(new ValidationPipe()) body: MaterialDTO,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() res: Response,
    @I18n() i18n: I18nContext,
    @Req() req: Request,
  ) {
    try {
      const accountId = (req as any).user.id;
      if (Number(body.materialTypeId) === 1 && (!files || files.length === 0)) {
        return res
          .status(400)
          .json(
            new ResponseData<null>(
              null,
              StatusCodeHTTP.BAD_REQUEST,
              i18n.t('common.at_least_one_file'),
            ),
          );
      }

      const materials = await this.materialService.addMaterial(
        body,
        files,
        accountId,
      );
      const url = this.configService.get<string>('RAG_URL') ?? '';
      await axios.post(`${url}/documents/process`, {
        materials,
      });

      return res
        .status(201)
        .json(
          new ResponseData<object | object[]>(
            materials,
            StatusCodeHTTP.CREATED,
            MessageHTTP.CREATED,
          ),
        );
    } catch (error) {
      console.log(error)
      return res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error?.response?.data?.detail ||
            error.message ||
            'An error occurred',
          ),
        );
    }
  }

  @Get('/get-all-materials')
  async getAllMaterials(
    @Res() res: Response,
    @Query() query: { store?: string; role?: string },
  ) {
    try {
      const { store, role } = query;
      const materials = await this.materialService.getAllMaterials(store, role);
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
      const material = await this.materialService.getDetailMaterial(id);
      return res
        .status(200)
        .json(
          new ResponseData<Object | null>(
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

  @Get('/get-all-materials-by-store-id')
  async getAllMaterialsByStoreId(@Res() res: Response) {
    try {
      const materials = await this.materialService.getAllMaterialsByStore();
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
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { id, status } = body;
      const updatedMaterial = await this.materialService.changeStatus(
        id,
        status,
      );

      // update in vectordb
      const materials = [
        {
          material_id: id,
          material_name: updatedMaterial?.name,
          new_status: status,
        },
      ];
      const url = this.configService.get<string>('RAG_URL') ?? '';
      await axios.post(`${url}/documents/toggle-active`, {
        materials,
      });

      return res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.SUCCESS,
            i18n.t('common.success_update'),
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

  @Delete('delete/:id')
  async deleteMaterial(
    @Param('id') id: number,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    try {
      // Delete in vectordb
      const material = await this.materialService.getDetailMaterial(id);
      const collection_name = `${material?.name}_${material?.id}`;
      const url = this.configService.get<string>('RAG_URL') ?? '';
      await axios.delete(`${url}/documents/delete-material`, {
        data: { collection_name },
      });
      // Delete in mysql
      await this.materialService.deleteMaterial(id);

      return res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.SUCCESS,
            i18n.t('common.success_delete_material'),
          ),
        );
    } catch (error) {
      console.log(error);
      return res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error?.response?.data?.detail ||
            error.message ||
            'An error occurred',
          ),
        );
    }
  }

  @Post('save-url-material')
  async saveUrlMaterial(@Body() body: MaterialDTO, @Res() res: Response) {
    try {
      await this.materialService.saveMaterial(body);
      return res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
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
            error?.response?.data?.detail ||
            error.message ||
            'An error occurred',
          ),
        );
    }
  }

  @Post('sync-user-material/:id')
  async syncUserMaterial(@Param('id') id: number, @Res() res: Response) {
    try {
      const material = await this.materialService.getDetailMaterial(id);
      const url = this.configService.get<string>('RAG_URL') ?? '';
      await axios.post(`${url}/documents/process`, {
        materials: [material],
      });
      await this.materialService.syncUserMaterial(id);

      return res
        .status(201)
        .json(
          new ResponseData<object>(
            material!,
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
            error?.response?.data?.detail ||
            error.message ||
            'An error occurred',
          ),
        );
    }
  }
  @Delete('delete-user-material/:id')
  async deleteUserMaterial(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.materialService.deleteMaterial(id);
      return res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.SUCCESS,
            MessageHTTP.SUCCESS,
          ),
        );
    } catch (error) {
      console.log(error)
      return res
        .status(400)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.BAD_REQUEST,
            error?.response?.data?.detail ||
            error.message ||
            'An error occurred',
          ),
        );
    }
  }
}
