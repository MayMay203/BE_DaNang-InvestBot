import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Material } from './material.entity';

@Entity()
export class KnowledgeStore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column()
  status: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Material, (material) => material.knowledgeStore)
  materials: Material[];
}
