import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Story } from '../entities/story.entity';
import { StoryService } from '../services/story.service';
import { StoryController } from './story.controller';
import { AuthModule } from '../auth/auth.module';
import { Profile } from '../entities/profile.entity';
import { Follow } from '../entities/follow.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Story, Profile, Follow]),
        AuthModule,
    ],
    controllers: [StoryController],
    providers: [StoryService],
})
export class StoryModule {}
