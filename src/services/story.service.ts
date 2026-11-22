import {Injectable,NotFoundException,
    ForbiddenException,} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository,MoreThan, In} from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {Story} from '../entities/story.entity';
import { Profile } from '../entities/profile.entity';
import { Follow } from '../entities/follow.entity';

@Injectable()
export class StoryService {
    constructor(
        @InjectRepository(Story)
        private readonly storyRepository: Repository<Story>,

        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,

        @InjectRepository(Follow)
        private readonly followRepository: Repository<Follow>,
    ) {}
    

    async createStory(userId: number, image: string) {

        // Step 1: Calculate expiry time (24 hours)
        const expiresAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
        );

        // Step 2: Create the story
        const story = this.storyRepository.create({
            image: image,
            user: { id: userId },
            expires_at: expiresAt,
        });

        // Step 3: Save the story in database
        return this.storyRepository.save(story);
    }


    async getActiveStories(userId: number) {

        // Step 1: Get the people I follow
        const following = await this.followRepository.find({
            where: {
                follower: {
                    id: userId,
                },
            },
            relations: {
                following: true,
            },
        });

        // Step 2: Get their IDs and include my own ID
        const followingIds = following.map(
            (item) => item.following.id,
        );

        const allowedUserIds = [
            ...new Set([userId, ...followingIds]),
        ];

        // Step 3: Get active stories only from allowed users
        const stories = await this.storyRepository.find({
            where: {
                expires_at: MoreThan(new Date()),
                user: {
                    id: In(allowedUserIds),
                },
            },
            relations: {
                user: true,
            },
            order: {
                created_at: 'DESC',
            },
        });

        // Step 4: Get user IDs from stories
        const userIds = [
            ...new Set(stories.map((story) => story.user.id)),
        ];

        // Step 5: Get profile images
        const profiles = userIds.length
            ? await this.profileRepository.find({
                where: {
                    user: {
                        id: In(userIds),
                    },
                },
                relations: {
                    user: true,
                },
            })
            : [];

        // Step 6: Attach profile images
        const storiesWithProfiles = stories.map((story) => {
            const profile = profiles.find(
                (item) => item.user.id === story.user.id,
            );

            return {
                ...story,
                user: {
                    ...story.user,
                    profile_image: profile?.profile_image ?? null,
                },
            };
        });

        return {
            success: true,
            stories: storiesWithProfiles,
        };
    }
    
    
    async deleteStory(storyId: number, userId: number) {

    // Step 1: Find the story and its owner
        const story = await this.storyRepository.findOne({
            where: {
                id: storyId,
            },
            relations: {
                user: true,
            },
        });

        // Step 2: Check whether the story exists
        if (!story) {
            throw new NotFoundException('Story not found.');
        }

        // Step 3: Check whether the logged-in user owns this story
        if (Number(story.user.id) !== Number(userId)) {
            throw new ForbiddenException(
                'You cannot delete another user story.',
            );
        }

        // Step 4: Delete the story
        await this.storyRepository.remove(story);

        return {
            success: true,
            message: 'Story deleted successfully.',
        };
    }

    @Cron(CronExpression.EVERY_HOUR)
    async deleteExpiredStories() {
        const result = await this.storyRepository
            .createQueryBuilder()
            .delete()
            .where('expires_at <= :now', {
                now: new Date(),
            })
            .execute();

        return {
            success: true,
            deletedCount: result.affected ?? 0,
        };
    }
    

}

