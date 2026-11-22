
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Profile } from '../entities/profile.entity';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Follow } from '../entities/follow.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  
    async getProfile(userId: number, currentUserId: number) {
    const user = await this.userRepository.findOne({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    let profile = await this.profileRepository.findOne({
        where: {
        user: { id: userId },
        },
        relations: {
        user: true,
        },
    });

    // Create a profile if the user does not have one.
    if (!profile) {
        profile = new Profile();
        profile.user = user;
        profile.bio = null;
        profile.profile_image = null;
        profile.website = null;

        profile = await this.profileRepository.save(profile);
    }
    
    const follow = await this.followRepository.findOne({
      where: {
        follower: { id: currentUserId },
        following: { id: userId },
      },
    });

    const isFollowing = Boolean(follow);
//     console.log('Follow status:', isFollowing);
// console.log('Current user:', currentUserId);
// console.log('Profile owner:', userId);
    // Get total posts created by this user
    const postsCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.posts', 'post')
      .where('user.id = :userId', { userId })
      .getCount();

    // Get total followers of this user
    const followersCount = await this.followRepository.count({
      where: {
        following: { id: userId },
      },
    });

    // Get total users this user follows
    const followingCount = await this.followRepository.count({
      where: {
        follower: { id: userId },
      },
    });

    return {
        success: true,
        profile: {
        id: profile.id,
        bio: profile.bio,
        profile_image: profile.profile_image,
        website: profile.website,
        is_following: isFollowing,
        posts_count: postsCount,
        followers_count: followersCount,
        following_count: followingCount,
        user: {
            id: profile.user.id,
            name: profile.user.name,
            email: profile.user.email,
        },
        },
    };
    }

  async updateProfile(userId: number, data: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let profile = await this.profileRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!profile) {
    profile = new Profile();

    profile.user = user;
    profile.bio = null;
    profile.profile_image = null;
    profile.website = null;
    }

    Object.assign(profile, data);

    await this.profileRepository.save(profile);

    return {
      success: true,
      message: 'Profile updated successfully',
      profile,
    };
  }

  async updateProfileImage(userId: number, image: string) {
  // Step 1: Find the logged-in user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Step 2: Find the user's profile
    let profile = await this.profileRepository.findOne({
      where: {
        user: { id: userId },
      },
      relations: {
        user: true,
      },
    });

    // Step 3: Create a profile if one doesn't exist
    if (!profile) {
      profile = new Profile();
      profile.user = user;
      profile.bio = null;
      profile.website = null;
    }

    // Step 4: Save the uploaded image filename
    profile.profile_image = image;

    await this.profileRepository.save(profile);

    // Step 5: Return the updated profile
    return {
      success: true,
      message: 'Profile image uploaded successfully',
      profile,
    };
  }
}
