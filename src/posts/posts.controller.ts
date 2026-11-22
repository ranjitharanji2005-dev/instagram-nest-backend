import { Controller, Get,Post,Put,Delete,Body,Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdatePostDto } from '../dto/update-post.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import {UseInterceptors,UploadedFile,BadRequestException,} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    getPosts(
        @CurrentUser() user: any,
    ) {
        return this.postsService.findAll(user.sub);
    }

   @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads/posts',
                filename: (req, file, callback) => {
                    const uniqueName =
                        Date.now() + '-' + Math.round(Math.random() * 1e9);

                    callback(
                        null,
                        uniqueName + extname(file.originalname),
                    );
                },
            }),
        }),
    )
    createPost(
        @UploadedFile() file: any,
        @Body() data: CreatePostDto,
        @CurrentUser() user: any,
    ) {
        if (!file) {
            throw new BadRequestException('Please select an image');
        }

        return this.postsService.create(
            data,
            user.sub,
            file.filename,
        );
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    updatePost(
        @Param('id') id: string,
        @Body() data: UpdatePostDto,
        @CurrentUser() user: any,
    ) {
        return this.postsService.update(
            Number(id),
            data,
            user.sub,
        );
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    deletePost(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.postsService.delete(
            Number(id),
            user.sub,
        );
    }

    @Post(':post/like')
    @UseGuards(JwtAuthGuard)
    likePost(
        @Param('post') postId: string,
        @CurrentUser() user: any,
    ) {
        return this.postsService.toggleLike(
            Number(postId),
            user.sub,
        );
    }

    @Post(':post/comments')
    @UseGuards(JwtAuthGuard)
    createComment(
        @Param('post') postId: string,
        @Body() data: CreateCommentDto,
        @CurrentUser() user: any,
    ) {
        return this.postsService.createComment(
            Number(postId),
            user.sub,
            data,
        );
    }

    @Get('user/:id/posts')
    @UseGuards(JwtAuthGuard)
    getUserPosts(
        @Param('id') id: string,
    ) {
        return this.postsService.findByUser(Number(id));
    }

   
}
