import { Body, Controller, Post, Query, Res } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ResponseData } from 'src/global/globalClass';
import { MessageHTTP, StatusCodeHTTP } from 'src/global/globalEnum';
import { Response } from 'express';
import { QuestionAnswerDTO } from 'src/DTO/conversation/questionAnswer.dto';

@Controller('/conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}
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
}
