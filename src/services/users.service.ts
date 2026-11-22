import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';

import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
    ) {}

    async searchUsers(query: string) {
        console.log("SEARCH USERS METHOD CALLED");
        const users = await this.userRepository.find({
            where: {
                name: Like(`%${query}%`),
            },
        });

        if (users.length === 0) {
            return {
                success: true,
                users: [],
            };
        }
         
        const userIds = users.map((user) => user.id);

        // Get profile images directly from the profiles table
       const profiles = await this.profileRepository
        .createQueryBuilder('profile')
        .innerJoin('profile.user', 'user')
        .select('user.id', 'userId')
        .addSelect('profile.profile_image', 'profile_image')
        .where('user.id IN (:...userIds)', { userIds })
        .getRawMany();

        const results = users.map((user) => {
            const profile = profiles.find(
                (item: { userId: number; profile_image: string | null }) =>
                    Number(item.userId) === user.id,
            );

            return {
                id: user.id,
                name: user.name,
                profile_image: profile?.profile_image ?? null,
            };
        });

        return {
            success: true,
            users: results,
        };
    }
}