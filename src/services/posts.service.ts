import { Injectable ,NotFoundException,ForbiddenException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,In } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { Like } from '../entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { Profile } from '../entities/profile.entity';
import { Follow } from '../entities/follow.entity';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,

        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,

        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,

        @InjectRepository(Follow)
        private readonly followRepository: Repository<Follow>,
    ) {}

    async findAll(userId: number) {

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

        const allowedUserIds = [...new Set([
            userId,
            ...followingIds,
        ])];
    // Step 1: Get all posts with their users
        const posts = await this.postRepository.find({
            where: {
                user: {
                    id: In(allowedUserIds),
                },
            },
            relations: {
                user: true,
                comments: {
                    user: true,
                },
            },
            order: {
                created_at: 'DESC',
            },
        });

        // Step 2: Get the user IDs from the posts
        const userIds = [...new Set(posts.map((post) => post.user.id))];
        
        const likes = await this.likeRepository.find({
            where: {
                post: {
                    id: In(posts.map((post) => post.id)),
                },
            },
            relations: {
                user: true,
                post: true,
            },
        });
        // Step 3: Get profile information for those users
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

        // Step 4: Attach the profile image to each post's user
        return posts.map((post) => {
            const profile = profiles.find(
                (item) => item.user.id === post.user.id,
            );

            const postLikes = likes.filter(
                (like) => like.post.id === post.id,
            );

            return {
                ...post,
                user: {
                    ...post.user,
                    profile_image: profile?.profile_image ?? null,
                },
                likes_count: postLikes.length,
                is_liked: postLikes.some(
                    (like) => like.user.id === userId,
                ),
            };
        });
    }

    async create(data: CreatePostDto, userId: number, image: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const post = this.postRepository.create({
            caption: data.caption,
            image: image,
            user: user,
        });

        return this.postRepository.save(post);
    }

    async update(
        postId: number,
        data: UpdatePostDto,
        userId: number,
    ) {
        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: {
                user: true,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.user.id !== userId) {
            throw new ForbiddenException(
                'You cannot update another user post',
            );
        }

        post.caption = data.caption;
        post.image = data.image;

        return this.postRepository.save(post);
    }

    async delete(postId: number, userId: number) {
        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: {
                user: true,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.user.id !== userId) {
            throw new ForbiddenException(
                'You cannot delete another user post',
            );
        }

        await this.postRepository.remove(post);

        return {
            success: true,
            message: 'Post deleted successfully',
        };
    }
    
    async toggleLike(postId: number, userId: number) {

    // Step 1: Check whether the post exists
        const post = await this.postRepository.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Step 2: Check whether this user already liked the post
        const existingLike = await this.likeRepository.findOne({
            where: {
                user: { id: userId },
                post: { id: postId },
            },
        });

        // Step 3: If already liked, remove the like
        if (existingLike) {
            await this.likeRepository.remove(existingLike);

            return {
                success: true,
                message: 'Post unliked successfully',
                liked: false,
            };
        }

        // Step 4: Create a new like
        const like = this.likeRepository.create({
            user: { id: userId },
            post: { id: postId },
        });

        await this.likeRepository.save(like);

        return {
            success: true,
            message: 'Post liked successfully',
            liked: true,
        };
    }

    
    async createComment(
        postId: number,
        userId: number,
        data: CreateCommentDto,
    ) {
        // Step 1: Check whether the post exists
        const post = await this.postRepository.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Step 2: Find the logged-in user
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Step 3: Create the comment
        const comment = this.commentRepository.create({
            comment: data.comment,
            user: user,
            post: post,
        });

        // Step 4: Save the comment
        const savedComment = await this.commentRepository.save(comment);

        // Step 5: Return the comment with user details
        return {
            success: true,
            comment: {
                ...savedComment,
                user: {
                    id: user.id,
                    name: user.name,
                },
                user_id: user.id,
                post_id: post.id,
            },
        };
    }


    async findByUser(userId: number) {
        const posts = await this.postRepository.find({
            where: {
                user: { id: userId },
            },
            relations: {
                user: true,
            },
            order: {
                created_at: 'DESC',
            },
        });

        return {
            success: true,
            posts,
        };
    }
}
