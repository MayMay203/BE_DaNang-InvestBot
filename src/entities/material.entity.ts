import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { KnowledgeStore } from './knowledgeStore.entity';
import { MaterialType } from './materialType.entity';
import { AccessLevel } from './accessLevel.entity';
import { Account } from './account.entity';
import { QuestionAnswer } from './questionAnswer.entity';

@Entity()
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'longtext', nullable: true })
  text?: string;

  @Column({ nullable: true, default: '' })
  url: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @ManyToOne(
    () => KnowledgeStore,
    (knowledgeStore) => knowledgeStore.materials,
    { nullable: true },
  )
  knowledgeStore: KnowledgeStore | null;

  @ManyToOne(() => MaterialType, (materialType) => materialType.materials)
  materialType: MaterialType;

  @ManyToOne(() => AccessLevel, (accessLevel) => accessLevel.materials)
  accessLevel: AccessLevel;

  @ManyToOne(() => Account, (account) => account.materials)
  account: Account | null;

  @ManyToOne(() => QuestionAnswer, (qa) => qa.materials, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  questionAnswer: QuestionAnswer;
}
