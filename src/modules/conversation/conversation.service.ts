import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Account } from 'src/entities/account.entity';
import { Conversation } from 'src/entities/conversation.entity';
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

  async getAllConversations(accountId: number) {
    return await this.conversationRepository.find({
      where: { account: { id: accountId } },
    });
  }

  async createConversation(accountId: number, i18n: I18nContext) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) {
      throw new Error(i18n.t('common.account_not_found'));
    }
    return await this.conversationRepository.save({
      account,
      createdAt: new Date(),
      name: 'New chat',
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
    i18n: I18nContext,
  ) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['questionAnswer'],
    });

    if (!conversation) {
      throw new Error(i18n.t('common.conversation_not_found'));
    }

    if (
      !conversation.questionAnswer ||
      conversation.questionAnswer.length === 0
    ) {
      conversation.name = questionContent;
      await this.conversationRepository.save(conversation);
    }

    return await this.questionAnswerRepository.save({
      questionContent,
      answerContent,
      conversation,
    });
  }

  async deleteConversation(id: number) {
    await this.questionAnswerRepository.delete({
      conversation: { id },
    });
    await this.conversationRepository.delete(id);
  }

  async getDetailConversation(id: number) {
    return await this.questionAnswerRepository.find({
      where: { conversation: { id } },
      relations: ['materials', 'materials.materialType'],
    });
  }
}
