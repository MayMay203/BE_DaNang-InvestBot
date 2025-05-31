import { Body, Controller, Post, Query, Req, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
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
        i18n
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
    @Req() req: Request,
  ) {
    try {
      const accessToken = req.headers['authorization']?.split(' ')[1];
      const { conversationId, query } = body;
      const idList = await this.conversationService.getAllConversationIds();
      if (!idList.includes(conversationId)) {
        throw new Error('Conversation is not existed!');
      }
      
      const url = this.configService.get<string>('RAG_URL') ?? '';
      const data = await axios.post(`${url}/conversations/send-message`, {
        conversationId,
        query,
        accessToken,
      });

      // await this.conversationService.saveHistoryChat(
      //   conversationId,
      //   query,
      //   data.data,
      // );

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
    @Req() req: Request,
  ) {
    try {
      const accountId = (req as any).user.id;
      const roleId = (req as any).user.roleId;
      const accessToken = req.headers['authorization']?.split(' ')[1];
      let { conversationId, query } = body;
      const idList = await this.conversationService.getAllConversationIds();

      if (!idList.includes(Number(conversationId))) {
        throw new Error('Conversation is not existed!');
      }

      if (!files.length) throw new Error('At least one file is required');
      console.log(files);

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

      // handle save file into db
      if (roleId != 1) {
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
            account: { id: Number(accountId) },
          };

          return this.materialService.saveMaterial(materialData);
        });
        await Promise.all(savePromises);
      }

      // await this.conversationService.saveHistoryChat(
      //   conversationId,
      //   query,
      //   data.data,
      // );

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
}
