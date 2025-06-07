import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { Material } from './material.entity';

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

  @OneToMany(() => Material, (material) => material.questionAnswer)
  materials: Material[];
}
