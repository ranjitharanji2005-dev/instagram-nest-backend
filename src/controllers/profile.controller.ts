
import {
  Controller,Get,Put,Body,Req,UseGuards,Param,
  ParseIntPipe, Post,UploadedFile,BadRequestException,} from '@nestjs/common';

import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    [key: string]: any;
  };
}

interface JwtPayload {
  sub: number;
  email: string;
}

@Controller()

@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
  ) {}

    @Get('profile')
    getProfile(@CurrentUser() user: JwtPayload) {
        return this.profileService.getProfile(user.sub, user.sub);
    }

    @Put('profile')
    updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() data: UpdateProfileDto,
    ) {
    return this.profileService.updateProfile(
        req.user.sub,
        data,
    );
    }

    @Get('users/:id/profile')
    getUserProfile(
      @Param('id', ParseIntPipe) id: number,
      @CurrentUser() user: JwtPayload,
    ) {
      return this.profileService.getProfile(id, user.sub);
    }

    @Post('profile/image')
    @UseInterceptors(
      FileInterceptor('profile_image', {
        storage: diskStorage({
          destination: './uploads/profiles',
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
    uploadProfileImage(
      @Req() req: AuthenticatedRequest,
      @UploadedFile() file: Express.Multer.File,
    ) {
      if (!file) {
        throw new BadRequestException('Please select a profile image.');
      }

      return this.profileService.updateProfileImage(
        req.user.sub,
        file.filename,
      );
    }
}
