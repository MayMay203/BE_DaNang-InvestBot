import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { Request, Response } from 'express';
import { QuestionAnswerDTO } from 'src/DTO/conversation/questionAnswer.dto';
import { QueryDTO } from 'src/DTO/conversation/query.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { MaterialService } from '../material/material.service';
import { I18n, I18nContext } from 'nestjs-i18n';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('/conversation')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly configService: ConfigService,
    private readonly materialService: MaterialService,
  ) {}

  @Get('/get-all-conversations')
  async getAllConversation(@Res() res: Response, @Req() req: any) {
    try {
      const conversations = await this.conversationService.getAllConversations(
        req.user.id,
      );
      return res
        .status(201)
        .json(
          new ResponseData<Object>(
            conversations,
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
  @Post('/create')
  async createConversation(
    @Res() res: Response,
    @Query('accountId') accountId: number,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const conversation = await this.conversationService.createConversation(
        accountId,
        i18n,
      );
      return res
        .status(201)
        .json(
          new ResponseData<Object>(
            conversation,
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
            error.message,
          ),
        );
    }
  }

  @Post('/save-history-chat')
  async saveHistoryChat(
    @Body() body: QuestionAnswerDTO,
    @Res() res: Response,
    @I18n() i18n: I18nContext,
  ) {
    try {
      const { questionContent, answerContent, conversationId } = body;
      const message = await this.conversationService.saveHistoryChat(
        conversationId,
        questionContent,
        answerContent,
        i18n,
      );
      return res
        .status(201)
        .json(
          new ResponseData<Object>(
            message,
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
            error.message,
          ),
        );
    }
  }

  @Post('/send-message')
  async sendMessage(
    @Body() body: QueryDTO,
    @Res() res: Response,
    @Req() req: any,
    @I18n() i18n: I18nContext,
  ) {
    try {
      let { conversationId, query } = body;

      if(!conversationId){
        conversationId = (await this.conversationService.createConversation(req.user.id,i18n)).id
      }

      const countQuestion = await this.conversationService.countQuestionInConversation(conversationId)
      if(countQuestion > 15) return res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.MANY_REQUESTS,
            i18n.t('common.exceed_limit_question'),
          ),
        );

      const accessToken = req.headers['authorization']?.split(' ')[1];

      const url = this.configService.get<string>('RAG_URL') ?? '';
      const data = await axios.post(`${url}/conversations/send-message`, {
        conversationId,
        query,
        accessToken,
      });

      await this.conversationService.saveHistoryChat(
        conversationId,
        query,
        data.data,
        i18n,
      );

      return res
        .status(200)
        .json(
          new ResponseData<string>(
            data.data,
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

  @Post('/send-file-question')
  @UseInterceptors(FilesInterceptor('files'))
  async sendFileQuestion(
    @Body() body: QueryDTO,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() res: Response,
    @Req() req: any,
    @I18n() i18n: I18nContext,
  ) {
    try {
      let { conversationId, query } = body;
      
      if(!conversationId){
        conversationId = (await this.conversationService.createConversation(req.user.id,i18n)).id
      }

      const countQuestion = await this.conversationService.countQuestionInConversation(conversationId)
      if(countQuestion > 15) return res
        .status(200)
        .json(
          new ResponseData<null>(
            null,
            StatusCodeHTTP.MANY_REQUESTS,
            i18n.t('common.exceed_limit_question'),
          ),
        );

      if (!files.length) throw new Error('At least one file is required');

      const accountId = (req as any).user.id;
      const roleId = (req as any).user.roleId;
      const accessToken = req.headers['authorization']?.split(' ')[1];
      const preQuery = query;

      // Handle query with upload file
      const nameList = Array.from(files).map((file) => file.originalname);
      const fileTypes = Array.from(files).map((file) => file.mimetype);
      const fileLinks =
        await this.materialService.uploadFilesToDriveOnly(files);

      query += `\nLink được xuất sau khi tải file lên:\n${fileLinks.join('\n')}`;

      const url = this.configService.get<string>('RAG_URL') ?? '';

      const data = await axios.post(`${url}/conversations/send-message`, {
        conversationId,
        query,
        accessToken,
        fileTypes,
        nameList,
      });

      const newConver = await this.conversationService.saveHistoryChat(
        conversationId,
        preQuery,
        data.data,
        i18n,
      );

      // handle save file into db
      const savePromises = fileLinks.map((link, index) => {
        const materialData = {
          name: nameList[index],
          description: nameList[index],
          text: null,
          url: link,
          createdAt: new Date(),
          updatedAt: new Date(),
          materialType: { id: 1 },
          accessLevel: { id: 1 },
          account: Number(accountId) === 1 ? null : { id: Number(accountId) },
          questionAnswer: { id: newConver?.id },
        };

        return this.materialService.saveMaterial(materialData);
      });
      await Promise.all(savePromises);

      // handle delete file by user upload to query
      // this.materialService.deleteFilesFromDrive(fileLinks);

      return res
        .status(200)
        .json(
          new ResponseData<string>(
            data.data,
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

  @Delete('/delete/:id')
  async deleteConversation(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.conversationService.deleteConversation(id);
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
            error.message,
          ),
        );
    }
  }

  @Get('/detail-conversation/:id')
  async getDetailConversation(@Param('id') id: number, @Res() res: Response) {
    try {
      const questionAnswers =
        await this.conversationService.getDetailConversation(id);
      return res
        .status(200)
        .json(
          new ResponseData<Object>(
            questionAnswers,
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

  @Get('/get-conversations-by-account/:id')
  async getConversationsByAccount(@Param('id') id: number, @Res() res:Response){
    try{
      const conversations = await this.conversationService.getConversationsByAccount(id)
      return res
        .status(200)
        .json(
          new ResponseData<Object>(
            conversations,
            StatusCodeHTTP.SUCCESS,
            MessageHTTP.SUCCESS,
          ),
        );
    }
    catch(error){
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

  @Post('/search-chat')
  async searchChat(@Body() body: {searchText: string, accountId: number}, @Res() res:Response, @Req() req: any){
    try{
      const {searchText, accountId} = body
      const conversations = await this.conversationService.searchChat(searchText, accountId)
      return res
        .status(200)
        .json(
          new ResponseData<Object>(
            conversations,
            StatusCodeHTTP.SUCCESS,
            MessageHTTP.SUCCESS,
          ),
        );
    }
    catch(error){
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
}
