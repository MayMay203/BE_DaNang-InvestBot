import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity()
export class QuestionAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'longtext', nullable: true })
  questionContent: string;

  @Column({ type: 'longtext', nullable: true })
  answerContent: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.questionAnswer)
  conversation: Conversation;
}
