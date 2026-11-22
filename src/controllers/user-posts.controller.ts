import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from '../services/posts.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserPostsController {
  constructor(
    private readonly postsService: PostsService,
  ) {}

  @Get(':id/posts')
  getUserPosts(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.postsService.findByUser(id);
  }
}