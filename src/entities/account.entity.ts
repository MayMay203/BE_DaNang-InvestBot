import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  fullName: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ nullable: true })
  OTP: string;

  @Column()
  expiredAt: Date;

  @Column({ default: false })
  verified: boolean;

  @ManyToOne(() => Role, (role) => role.accounts)
  role: Role;
}
