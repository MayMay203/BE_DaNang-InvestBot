import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { AccessLevel } from './accessLevel.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Account, (account) => account.role)
  accounts: Account[];

  // @ManyToMany(() => AccessLevel, (accessLevel) => accessLevel.roles)
  // accessLevels: AccessLevel[];
}
