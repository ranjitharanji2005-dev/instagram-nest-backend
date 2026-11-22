import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Post } from './post.entity';

@Entity('users')
export class User {
  @OneToMany(() => Post, (post) => post.user)
  posts!: Post[];
  
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

 
  @Column({ type: 'varchar', nullable: true })
  password!: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  google_id!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}