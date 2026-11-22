
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({  type: 'varchar', nullable: true })
  profile_image: string | null;

  @Column({ type: 'varchar', nullable: true })
  website: string | null;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
