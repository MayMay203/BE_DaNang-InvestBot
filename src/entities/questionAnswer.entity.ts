import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity()
export class QuestionAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionContent: string;

  @Column()
  answerContent: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.questionAnswer)
  conversation: Conversation;
}
