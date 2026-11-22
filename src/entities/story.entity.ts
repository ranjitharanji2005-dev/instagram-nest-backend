import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity('stories')
export class Story {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    image!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @CreateDateColumn()
    created_at!: Date;

    @Column({ type: 'datetime' })
    expires_at!: Date;
}
