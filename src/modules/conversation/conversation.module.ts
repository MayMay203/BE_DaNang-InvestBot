import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from 'src/entities/conversation.entity';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { Account } from 'src/entities/account.entity';
import { QuestionAnswer } from 'src/entities/questionAnswer.entity';
import { ConfigService } from '@nestjs/config';
import { MaterialModule } from '../material/material.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Account, QuestionAnswer]),
    MaterialModule,
  ],
  controllers: [ConversationController],
  providers: [ConversationService, ConfigService],
})
export class ConversationModule {}
