import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { KnowledgeStore } from './knowledgeStore.entity';
import { MaterialType } from './materialType.entity';
import { AccessLevel } from './accessLevel.entity';

@Entity()
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  text: string;

  @Column()
  url: string;

  @Column({ default: false })
  isActive: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @ManyToOne(() => KnowledgeStore, (knowledgeStore) => knowledgeStore.materials)
  knowledgeStore: KnowledgeStore;

  @ManyToOne(() => MaterialType, (materialType) => materialType.materials)
  materialType: MaterialType;

  @ManyToOne(() => AccessLevel, (accessLevel) => accessLevel.materials)
  accessLevel: AccessLevel;
}
