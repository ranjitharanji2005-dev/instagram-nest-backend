import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Follow } from './entities/follow.entity';
import { User } from './entities/user.entity';
import { FollowService } from './services/follow.service';
import { FollowController } from './controllers/follow.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follow, User]),
    AuthModule,
  ],
  controllers: [FollowController],
  providers: [FollowService, JwtAuthGuard],
})
export class FollowModule {}
