import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    @Get('search')
    searchUsers(@Query('q') query: string) {
        return this.usersService.searchUsers(query);
    }
}