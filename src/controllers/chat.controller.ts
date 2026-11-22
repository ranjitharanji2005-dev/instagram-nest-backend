import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';

import { ChatService } from '../services/chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChatController {

    constructor(
        private readonly chatService: ChatService,
    ) {}
    
    @Get('conversations')
    getConversations(@Req() req: any) {
        return this.chatService.getConversations(req.user.sub);
    }

    @Get('users/:id/messages')
    getMessages(
        @Param('id') receiverId: number,
        @Req() req: any,
    ) {
        return this.chatService.getMessages(
            req.user.sub,
            Number(receiverId),
        );
    }

    @Post('users/:id/messages')
    sendMessage(
        @Param('id') receiverId: number,
        @Body('message') message: string,
        @Req() req: any,
    ) {
        return this.chatService.sendMessage(
            req.user.sub,
            Number(receiverId),
            message,
        );
    }

    @Patch('users/:id/messages/read')
    markAsRead(
        @Param('id') senderId: number,
        @Req() req: any,
    ) {
        return this.chatService.markAsRead(
            req.user.sub,
            Number(senderId),
        );
    }
}