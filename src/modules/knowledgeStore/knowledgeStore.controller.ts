import { Body, Controller, Get, Param, Patch, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { KnowledgeStoreService } from './knowledgeStore.service';
import { KnowledgeStoreDTO } from 'src/DTO/knowledgeStore/knowledgeStore.dto';
import { ChangeStatusDTO } from 'src/DTO/account/changeStatus.dto';
import { AssignMaterialsToStoreDto } from 'src/DTO/knowledgeStore/assignMaterialsToKnowledgeStore.dto';
import { RemoveMaterialDTO } from 'src/DTO/knowledgeStore/removeMaterial.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller('knowledge-store')
export class KnowledgeStoreController {
  constructor(
    private readonly knowledgeStoreService: KnowledgeStoreService,
    private readonly configService: ConfigService,
  ) {}

    @Get('/get-all')
  async getAllKnowledgeStore(@Res() res: Response) {
    try {
      const knowledgeStores =
      await this.knowledgeStoreService.getAllKnowledStore();
      console.log(knowledgeStores)
      return res
        .status(200)
        .json(
          new ResponseData<Object>(
            knowledgeStores,
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
  async getDetailKnowledgeStore(@Res() res: Response, @Param('id') id: number) {
    try {
      const knowledgeStore =
        await this.knowledgeStoreService.getDetailKnowledgeStore(id);
      return res
        .status(200)
        .json(
          new ResponseData<Object>(
            knowledgeStore!,
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

  @Post('/create')
  async createNewKnowledgeStore(
    @Body() body: KnowledgeStoreDTO,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { name, description } = body;
      console.log('VO day')
      const knowledgeStore =
        await this.knowledgeStoreService.createKnowledgeStore(
          name,
          description,
          i18n,
        );
      return res
        .status(201)
        .json(
          new ResponseData<Object>(
            knowledgeStore,
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
            error.message || 'An error occurred',
          ),
        );
    }
  }

  @Patch('/update/:id')
  async updateKnowledgeStore(
    @Param('id') id: number,
    @Body() body: KnowledgeStoreDTO,
    @Res() res: Response,
  ) {
    try {
      const { name, description } = body;
      const material = await this.knowledgeStoreService.updateKnowledStore(
        id,
        name,
        description,
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
      const materialList =
        await this.knowledgeStoreService.changeStatusKnowledgeStore(id, status);

      // update active in vectordb
      const materials = materialList.map((material) => ({
        material_id: material.id,
        material_name: material.name,
        new_status: status,
      }));

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

  @Post('/add-materials')
  async addMaterials(
    @Body() body: AssignMaterialsToStoreDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { knowledgeStoreId, materialIds } = body;
      await this.knowledgeStoreService.addMaterials(
        knowledgeStoreId,
        materialIds,
        i18n,
      );
      return res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.SUCCESS,
            'Add materials into knowledge store successfully!',
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

  @Post('/remove-materials')
  async removeMaterial(
    @Body() body: RemoveMaterialDTO,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { knowledgeStoreId, materialIds } = body;
      await this.knowledgeStoreService.removeMaterial(
        knowledgeStoreId,
        materialIds,
        i18n,
      );
      return res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.SUCCESS,
            'Remove materials from knowledge store successfully!',
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
