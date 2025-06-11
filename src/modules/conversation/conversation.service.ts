import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Account } from 'src/entities/account.entity';
import { Conversation } from 'src/entities/conversation.entity';
import { QuestionAnswer } from 'src/entities/questionAnswer.entity';
import { Brackets, Repository } from 'typeorm';

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

  async countQuestionInConversation(id: number) {
    const count = await this.questionAnswerRepository.count({
      where: { conversation: { id } },
    });
    return count;
  }

  async getConversationsByAccount(id: number) {
    const conversations = await this.conversationRepository.find({
      where: {
        account: {
          id: id
        }
      },
      relations: ['account'] 
    });
    return conversations;
  }

async searchChat(searchText: string, accountId: number) {
  const lowerText = searchText.toLowerCase();

  const matches = await this.questionAnswerRepository
    .createQueryBuilder('qa')
    .leftJoinAndSelect('qa.conversation', 'conversation')
    .where('conversation.accountId = :accountId', { accountId })
    .andWhere(new Brackets(qb => {
      qb.where('LOWER(qa.questionContent) LIKE :text', { text: `%${lowerText}%` })
        .orWhere('LOWER(qa.answerContent) LIKE :text', { text: `%${lowerText}%` });
    }))
    .getMany();

  // Gom QA theo conversationId
  const map = new Map<number, { conversation: any; resultSearch: string[] }>();

  for (const qa of matches) {
    const conv = qa.conversation;

    if (!map.has(conv.id)) {
      const { questionAnswer, ...cleanConv } = conv;
      map.set(conv.id, { conversation: cleanConv, resultSearch: [] });
    }

    const entry = map.get(conv.id)!;

    if (qa.questionContent?.toLowerCase().includes(lowerText)) {
      entry.resultSearch.push(qa.questionContent);
    }
    if (qa.answerContent?.toLowerCase().includes(lowerText)) {
      entry.resultSearch.push(qa.answerContent);
    }
  }

  return Array.from(map.values()).map(({ conversation, resultSearch }) => ({
    ...conversation,
    resultSearch,
  }));
}
}
