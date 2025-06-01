import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { QuestionAnswer } from './questionAnswer.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: String;

  @Column()
  createdAt: Date;

  @ManyToOne(() => Account, (account) => account.conversations)
  account: Account;
  @OneToMany(
    () => QuestionAnswer,
    (questionAnswer) => questionAnswer.conversation,
  )
  questionAnswer: QuestionAnswer[];
}
