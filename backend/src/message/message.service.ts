import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message, MessageType } from './entities/message.entity';
import { User } from '../user/entities/user.entity';
import { SendMessageDto, GetMessagesDto } from './dto/message.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createOrGetConversation(userId: number, targetId: number): Promise<Conversation> {
    if (userId === targetId) {
      throw new BadRequestException('不能与自己创建会话');
    }

    const targetUser = await this.userRepository.findOne({ where: { id: targetId } });
    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }

    const participantIds = [userId, targetId].sort((a, b) => a - b);

    let conversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.participantIds @> ARRAY[:...ids]::int[]', { ids: participantIds })
      .andWhere('array_length(conversation.participantIds, 1) = 2')
      .getOne();

    if (!conversation) {
      conversation = this.conversationRepository.create({
        participantIds,
        unreadCounts: {
          [userId]: 0,
          [targetId]: 0,
        },
      });
      conversation = await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  async getConversationList(userId: number) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participantIds)', { userId })
      .orderBy('conversation.lastMessageTime', 'DESC')
      .addOrderBy('conversation.createdAt', 'DESC')
      .getMany();

    const targetUserIds = conversations.map((conv) => {
      return conv.participantIds.find((id) => id !== userId)!;
    });

    const users = await this.userRepository.find({
      where: { id: In(targetUserIds.length > 0 ? targetUserIds : [0]) },
      select: ['id', 'nickname', 'avatar'],
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return conversations.map((conv) => {
      const targetId = conv.participantIds.find((id) => id !== userId)!;
      return {
        id: conv.id,
        participantIds: conv.participantIds,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCounts?.[userId] || 0,
        targetUser: userMap.get(targetId) || { id: targetId, nickname: null, avatar: null },
      };
    });
  }

  async getMessages(userId: number, conversationId: number, dto: GetMessagesDto) {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    if (!conversation) {
      throw new NotFoundException('会话不存在');
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('无权访问该会话');
    }

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
      relations: ['sender', 'receiver'],
    });

    const reversedMessages = messages.reverse().map((msg) => {
      const { sender, receiver, ...rest } = msg;
      return {
        ...rest,
        sender: sender
          ? { id: sender.id, nickname: sender.nickname, avatar: sender.avatar }
          : null,
        receiver: receiver
          ? { id: receiver.id, nickname: receiver.nickname, avatar: receiver.avatar }
          : null,
      };
    });

    return {
      list: reversedMessages,
      total,
      page,
      pageSize,
    };
  }

  async sendMessage(userId: number, dto: SendMessageDto) {
    const conversation = await this.createOrGetConversation(userId, dto.receiverId);

    const message = this.messageRepository.create({
      conversationId: conversation.id,
      senderId: userId,
      receiverId: dto.receiverId,
      type: dto.type || MessageType.TEXT,
      content: dto.content,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    conversation.lastMessage = dto.content;
    conversation.lastMessageTime = new Date();
    conversation.unreadCounts = conversation.unreadCounts || {};
    conversation.unreadCounts[dto.receiverId] = (conversation.unreadCounts[dto.receiverId] || 0) + 1;
    await this.conversationRepository.save(conversation);

    const fullMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'receiver'],
    });

    const { sender, receiver, ...rest } = fullMessage!;
    return {
      ...rest,
      sender: sender
        ? { id: sender.id, nickname: sender.nickname, avatar: sender.avatar }
        : null,
      receiver: receiver
        ? { id: receiver.id, nickname: receiver.nickname, avatar: receiver.avatar }
        : null,
    };
  }

  async markAsRead(userId: number, conversationId: number) {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    if (!conversation) {
      throw new NotFoundException('会话不存在');
    }

    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('无权访问该会话');
    }

    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('receiverId = :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();

    conversation.unreadCounts = conversation.unreadCounts || {};
    conversation.unreadCounts[userId] = 0;
    await this.conversationRepository.save(conversation);

    return { success: true };
  }

  async getUnreadCount(userId: number) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participantIds)', { userId })
      .getMany();

    const total = conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCounts?.[userId] || 0);
    }, 0);

    return { count: total, unreadCount: total };
  }

  async uploadImage(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.png';
    const filename = `chat_${userId}_${timestamp}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    return { url: `/uploads/${filename}` };
  }
}
