import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity('messages')
export class Message {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    message!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'sender_id' })
    sender!: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'receiver_id' })
    receiver!: User;

    @Column({ default: false })
    is_read!: boolean;

    @CreateDateColumn()
    created_at!: Date;
}
