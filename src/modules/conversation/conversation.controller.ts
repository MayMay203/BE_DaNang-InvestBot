import { Body, Controller, Post, Query, Req, Res } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { Request, Response } from 'express';
import { QuestionAnswerDTO } from 'src/DTO/conversation/questionAnswer.dto';
import { QueryDTO } from 'src/DTO/conversation/query.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { MaterialService } from '../material/material.service';

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
  ) {
    try {
      const conversation =
        await this.conversationService.createConversation(accountId);
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
  async saveHistoryChat(@Body() body: QuestionAnswerDTO, @Res() res: Response) {
    try {
      const { questionContent, answerContent, conversationId } = body;
      const message = await this.conversationService.saveHistoryChat(
        conversationId,
        questionContent,
        answerContent,
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
      const accessToken = req.headers['authorization']?.split(' ')[1]
      const { conversationId, query } = body;
      const idList = await this.conversationService.getAllConversationIds();
      if (!idList.includes(conversationId)) {
        throw new Error('Conversation is not existed!');
      }
      const materialsByStore =
        await this.materialService.getAllMaterialsByStore();
      const url = this.configService.get<string>('RAG_URL') ?? '';
      const data = await axios.post(`${url}/conversations/send-message`, {
        conversationId,
        query,
        materialsByStore,
        accessToken
      });
      await this.conversationService.saveHistoryChat(
        conversationId,
        query,
        data.data,
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
}
