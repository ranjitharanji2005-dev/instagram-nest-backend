import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPostsController } from '../controllers/user-posts.controller';
import { PostsController } from './posts.controller';
import { PostsService } from '../services/posts.service';
import { Post } from '../entities/post.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../entities/user.entity';
import { Like } from '../entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { Profile } from '../entities/profile.entity';
import { Follow } from '../entities/follow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Like, Comment, Profile, Follow,]),AuthModule,],
  controllers: [PostsController, UserPostsController],
  providers: [PostsService],
})
export class PostsModule {}
