
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from 'typeorm';
import { Follow } from '../entities/follow.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getFollowers(userId: number) {
    const follows = await this.followRepository.find({
      where: {
        following: { id: userId },
      },
      relations: {
        follower: true,
      },
    });

    return follows.map((follow) => follow.follower);
  }

  async getFollowing(userId: number) {
    const follows = await this.followRepository.find({
      where: {
        follower: { id: userId },
      },
      relations: {
        following: true,
      },
    });

    return follows.map((follow) => follow.following);
  }

  async followUser(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const follower = await this.userRepository.findOne({
      where: { id: followerId },
    });

    const following = await this.userRepository.findOne({
      where: { id: followingId },
    });

    if (!follower || !following) {
      throw new NotFoundException('User not found');
    }

    const existingFollow = await this.followRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this user');
    }

    const follow = this.followRepository.create({
      follower,
      following,
    });

    await this.followRepository.save(follow);

    return {
      success: true,
      message: 'User followed successfully',
    };
  }


  async unfollowUser(followerId: number, followingId: number) {
    const follow = await this.followRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.followRepository.remove(follow);

    return {
      success: true,
      message: 'User unfollowed successfully',
    };
  }
  
  async searchUsers(query: string, currentUserId: number) {
    const users = await this.userRepository.find({
      where: [
        { name: Like(`%${query}%`) },
        { email: Like(`%${query}%`) },
      ],
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 20,
    });

    return users.filter((user) => user.id !== currentUserId);
  }

  async isFollowing(followerId: number, followingId: number) {
      const follow = await this.followRepository.findOne({
          where: {
              follower: { id: followerId },
              following: { id: followingId },
          },
      });

      return Boolean(follow);
  }

}
