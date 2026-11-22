import {
  Controller,Get,Post,Delete,Req,Body,
  Param,ParseIntPipe,UseGuards,} from '@nestjs/common';
import { Request } from 'express';
import { FollowService } from '../services/follow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
  };
}
@Controller('users')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(
    private readonly followService: FollowService,
  ) {}

  @Get(':id/followers')
  getFollowers(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.followService.getFollowers(id);
  }

  @Get(':id/following')
  getFollowing(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.followService.getFollowing(id);
  }


  @Post(':id/follow')
  followUser(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.followService.followUser(
      req.user.sub,
      id,
    );
  }

  @Delete(':id/unfollow')
  unfollowUser(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.followService.unfollowUser(
      req.user.sub,
      id,
    );
  }


}
