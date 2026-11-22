import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';

import { ChatController } from '../controllers/chat.controller';
import { ChatService } from '../services/chat.service';

import { AuthModule } from '../auth/auth.module';
import { Follow } from '../entities/follow.entity';

@Module({
     imports: [
        TypeOrmModule.forFeature([
            Message,
            User,
            Profile,
            Follow,
        ]),
        AuthModule,
    ],
    
    controllers: [ChatController],
    providers: [ChatService],
})
export class ChatModule {}

