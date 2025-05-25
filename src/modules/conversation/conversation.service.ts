import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Account } from 'src/entities/account.entity';
import { Conversation } from 'src/entities/conversation.entity';
import { Material } from 'src/entities/material.entity';
import { QuestionAnswer } from 'src/entities/questionAnswer.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    @InjectRepository(QuestionAnswer)
    private questionAnswerRepository: Repository<QuestionAnswer>,
  ) {}

  async createConversation(accountId: number, i18n:I18nContext) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) {
      throw new Error(i18n.t('common.account_not_found'));
    }
    return await this.conversationRepository.save({
      account,
      createdAt: new Date(),
    });
  }

  async getAllConversationIds() {
    const conversations = await this.conversationRepository.find({
      select: ['id'],
    });
    return conversations.map(({ id }) => id);
  }

  async saveHistoryChat(
    conversationId: number,
    questionContent: string,
    answerContent: string,
    i18n: I18nContext
  ) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) throw new Error(i18n.t('common.conversation_not_found'));
    return await this.questionAnswerRepository.save({
      questionContent,
      answerContent,
      conversation,
    });
  }
}
