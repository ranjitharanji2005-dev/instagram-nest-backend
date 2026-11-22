import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { Profile } from './entities/profile.entity';
import { ProfileModule } from './profile.module';
import { Follow } from './entities/follow.entity';
import { FollowModule } from './follow.module';
import { Story } from './entities/story.entity';
import { StoryModule } from './story/story.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users.module';
import { Message } from './entities/message.entity';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true,}),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [User, Post, Like, Comment, Profile, Follow, Story, Message],
        synchronize: true,
      }),
    }),
    AuthModule,
    PostsModule,
    ProfileModule,
    FollowModule,
    StoryModule,
    UsersModule,
    ScheduleModule.forRoot(),
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
