import {
    Controller,Get,Post,Delete,Req,UseGuards, UseInterceptors,
    UploadedFile, BadRequestException,ParseIntPipe,Param,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { Request } from 'express';

import { StoryService } from '../services/story.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
    user: {
        sub: number;
        email: string;
    };
}

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoryController {
    constructor(
        private readonly storyService: StoryService,
    ) {}

    @Post()
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads/stories',
                filename: (req, file, callback) => {
                    const uniqueName =
                        Date.now() +
                        '-' +
                        Math.round(Math.random() * 1e9) +
                        extname(file.originalname);

                    callback(null, uniqueName);
                },
            }),
        }),
    )
    createStory(
        @Req() req: AuthenticatedRequest,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException(
                'Please select a story image.',
            );
        }

        return this.storyService.createStory(
            req.user.sub,
            file.filename,
        );
    }

   @Get()
    getActiveStories(
        @Req() req: AuthenticatedRequest,
    ) {
        return this.storyService.getActiveStories(
            req.user.sub,
        );
    }

    @Delete(':id')
    deleteStory(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.storyService.deleteStory(
            id,
            req.user.sub,
        );
    }
}
