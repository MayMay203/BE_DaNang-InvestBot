import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Material } from './material.entity';

@Entity()
export class AccessLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Material, (material) => material.accessLevel)
  materials: Material[];

  @ManyToMany(() => Role, (role) => role.accessLevels)
  @JoinTable({
    name: 'AccessLevel_Role',
    joinColumn: {
      name: 'accessLevelID',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'roleID',
      referencedColumnName: 'id',
    },
  })
  roles: Role[];
}
