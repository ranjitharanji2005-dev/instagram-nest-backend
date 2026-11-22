import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository , In} from 'typeorm';

import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { Follow } from '../entities/follow.entity';

@Injectable()
export class ChatService {

    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,

        @InjectRepository(Follow)
        private readonly followRepository: Repository<Follow>,
    ) {}

    
    async getConversations(userId: number) {

        // Get people followed by the logged-in user
        const follows = await this.followRepository.find({
            where: {
                follower: { id: userId },
            },
            relations: {
                following: true,
            },
        });

        // Get all messages involving the logged-in user
        const messages = await this.messageRepository.find({
            where: [
                { sender: { id: userId } },
                { receiver: { id: userId } },
            ],
            relations: {
                sender: true,
                receiver: true,
            },
            order: {
                created_at: 'DESC',
            },
        });

        // Collect followed users and people with existing chats
        const usersMap = new Map<number, User>();

        follows.forEach((follow) => {
            usersMap.set(follow.following.id, follow.following);
        });

        messages.forEach((message) => {
            const otherUser =
                message.sender.id === userId
                    ? message.receiver
                    : message.sender;

            usersMap.set(otherUser.id, otherUser);
        });

        // Get profile images
        const userIds = Array.from(usersMap.keys());

        const profiles = userIds.length
            ? await this.profileRepository.find({
                where: {
                    user: { id: In(userIds) },
                },
                relations: {
                    user: true,
                },
            })
            : [];

        const profileMap = new Map<number, string | null>();

        profiles.forEach((profile) => {
            profileMap.set(profile.user.id, profile.profile_image);
        });

        // Create conversation list
        const conversations = Array.from(usersMap.values()).map((user) => {

            const userMessages = messages.filter(
                (message) =>
                    (message.sender.id === user.id &&
                        message.receiver.id === userId) ||
                    (message.sender.id === userId &&
                        message.receiver.id === user.id),
            );

            const latestMessage = userMessages[0];

            const unreadCount = userMessages.filter(
                (message) =>
                    message.sender.id === user.id &&
                    message.receiver.id === userId &&
                    !message.is_read,
            ).length;

            const profileImage = profileMap.get(user.id);

            return {
                id: user.id,
                name: user.name,
                profile_image_url: profileImage
                    ? `http://localhost:3000/uploads/profiles/${profileImage}`
                    : null,
                latest_message: latestMessage
                    ? latestMessage.message
                    : null,
                latest_message_at: latestMessage
                    ? latestMessage.created_at
                    : null,
                unread_count: unreadCount,
            };
        });

        return {
            conversations,
        };
    }

    async getMessages(userId: number, otherUserId: number) {

        const messages = await this.messageRepository.find({
            where: [
                {
                    sender: { id: userId },
                    receiver: { id: otherUserId },
                },
                {
                    sender: { id: otherUserId },
                    receiver: { id: userId },
                },
            ],
            relations: {
                sender: true,
                receiver: true,
            },
            order: {
                created_at: 'ASC',
            },
        });

        return {
            messages: messages.map((item) => ({
                id: item.id,
                message: item.message,
                sender_id: item.sender.id,
                receiver_id: item.receiver.id,
                is_read: item.is_read,
                created_at: item.created_at,
            })),
        };
    }

    async sendMessage(
        senderId: number,
        receiverId: number,
        message: string,
    ) {

        const sender = await this.userRepository.findOne({
            where: { id: senderId },
        });

        const receiver = await this.userRepository.findOne({
            where: { id: receiverId },
        });

        if (!sender || !receiver) {
            throw new Error('User not found');
        }

        const newMessage = this.messageRepository.create({
            sender,
            receiver,
            message,
            is_read: false,
        });

        const savedMessage = await this.messageRepository.save(newMessage);

        return {
            success: true,
            message: {
                id: savedMessage.id,
                message: savedMessage.message,
                sender_id: sender.id,
                receiver_id: receiver.id,
                is_read: savedMessage.is_read,
                created_at: savedMessage.created_at,
            },
        };
    }

    async markAsRead(userId: number, senderId: number) {

        await this.messageRepository.update(
            {
                sender: { id: senderId },
                receiver: { id: userId },
                is_read: false,
            },
            {
                is_read: true,
            },
        );

        return {
            success: true,
            message: 'Messages marked as read',
        };
    }
}

