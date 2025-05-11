import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { KnowledgeStoreService } from './knowledgeStore.service';
import { KnowledgeStoreDTO } from 'src/DTO/knowledgeStore/knowledgeStore.dto';
import { ChangeStatusDTO } from 'src/DTO/account/changeStatus.dto';
import { AssignMaterialsToStoreDto } from 'src/DTO/knowledgeStore/assignMaterialsToKnowledgeStore.dto';
import { RemoveMaterialDTO } from 'src/DTO/knowledgeStore/removeMaterial.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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
      return res
        .status(200)
        .json(
          new ResponseData<Array<Object>>(
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
  @Post('/create')
  async createNewKnowledgeStore(
    @Body() body: KnowledgeStoreDTO,
    @Res() res: Response,
  ) {
    try {
      const { name, description } = body;
      const knowledgeStore =
        await this.knowledgeStoreService.createKnowledgeStore(
          name,
          description,
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
      await this.knowledgeStoreService.changeStatusKnowledgeStore(id, status);
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
  ) {
    try {
      const { knowledgeStoreId, materialIds } = body;
      await this.knowledgeStoreService.addMaterials(
        knowledgeStoreId,
        materialIds,
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

  @Post('/remove-material')
  async removeMaterial(@Body() body: RemoveMaterialDTO, @Res() res: Response) {
    try {
      const { knowledgeStoreId, materialId } = body;
      await this.knowledgeStoreService.removeMaterial(
        knowledgeStoreId,
        materialId,
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

  @Post('/async')
  async asyncKnowledgeStore(@Query('id') id: number, @Res() res: Response) {
    try {
      const materials =
        await this.knowledgeStoreService.asyncKnowledgeStore(id);

      // handle proccess ducument from RAG server
      const url = this.configService.get<string>('RAG_URL') ?? '';
      const response = await axios.post(`${url}/documnents/process`, {
        materials,
      });

      if (response.status === 200 && response.data.message) {
        return res
          .status(200)
          .json(
            new ResponseData<null>(
              null,
              StatusCodeHTTP.SUCCESS,
              response.data.message,
            ),
          );
      } else {
        throw new Error('Failed to process documents');
      }
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
