import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { MessageService } from './message.service';
import { SendMessageDto } from './dto/message.dto';
import { MessageType } from './entities/message.entity';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers: Map<number, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private messageService: MessageService,
  ) {}

  private getUserIdFromSocket(socket: Socket): number | null {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return null;
      const payload = this.jwtService.verify(token as string);
      return payload.sub || payload.userId || payload.id;
    } catch (e) {
      return null;
    }
  }

  handleConnection(socket: Socket) {
    const userId = this.getUserIdFromSocket(socket);
    if (!userId) {
      this.logger.warn('未授权的 WebSocket 连接尝试，已断开');
      socket.disconnect(true);
      return;
    }

    socket.data.userId = userId;

    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socket.id);

    this.logger.log(`用户 ${userId} 连接，socketId: ${socket.id}`);

    socket.emit('connected', { userId, online: true });
    this.broadcastOnlineStatus();
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId as number;
    if (!userId) return;

    const userSockets = this.onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.onlineUsers.delete(userId);
        this.logger.log(`用户 ${userId} 已完全离线`);
      }
    }

    this.broadcastOnlineStatus();
  }

  private broadcastOnlineStatus() {
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    this.server.emit('onlineStatus', { onlineUserIds });
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() socket: Socket) {
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    socket.emit('onlineUsers', { onlineUserIds });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SendMessageDto & { conversationId?: number },
  ) {
    const userId = socket.data.userId as number;
    if (!userId) return;

    try {
      const message = await this.messageService.sendMessage(userId, {
        receiverId: dto.receiverId,
        type: (dto.type as MessageType) || MessageType.TEXT,
        content: dto.content,
        duration: dto.duration,
      });

      const receiverSockets = this.onlineUsers.get(dto.receiverId);
      if (receiverSockets) {
        receiverSockets.forEach((socketId) => {
          this.server.to(socketId).emit('newMessage', message);
        });
      }

      const senderSockets = this.onlineUsers.get(userId);
      if (senderSockets) {
        senderSockets.forEach((socketId) => {
          if (socketId !== socket.id) {
            this.server.to(socketId).emit('newMessage', message);
          }
        });
      }

      socket.emit('messageSent', { success: true, message });

      this.emitConversationUpdate(userId, dto.receiverId);
    } catch (error: any) {
      socket.emit('messageError', { message: error.message });
    }
  }

  private async emitConversationUpdate(userId1: number, userId2: number) {
    try {
      const [conv1, conv2] = await Promise.all([
        this.messageService.getConversationList(userId1),
        this.messageService.getConversationList(userId2),
      ]);

      const user1Sockets = this.onlineUsers.get(userId1);
      if (user1Sockets) {
        user1Sockets.forEach((socketId) => {
          this.server.to(socketId).emit('conversationUpdate', conv1);
        });
      }

      const user2Sockets = this.onlineUsers.get(userId2);
      if (user2Sockets) {
        user2Sockets.forEach((socketId) => {
          this.server.to(socketId).emit('conversationUpdate', conv2);
        });
      }
    } catch (e) {}
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const userId = socket.data.userId as number;
    if (!userId) return;

    try {
      await this.messageService.markAsRead(userId, data.conversationId);

      const conversations = await this.messageService.getConversationList(userId);
      socket.emit('conversationUpdate', conversations);

      const convs = await this.messageService.getConversationList(userId);
      const targetConv = convs.find((c: any) => c.id === data.conversationId);
      if (targetConv && targetConv.targetUser?.id) {
        const targetSockets = this.onlineUsers.get(targetConv.targetUser.id);
        if (targetSockets) {
          const targetConvs = await this.messageService.getConversationList(targetConv.targetUser.id);
          targetSockets.forEach((socketId) => {
            this.server.to(socketId).emit('conversationUpdate', targetConvs);
          });
        }
      }
    } catch (e) {}
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { receiverId: number; isTyping: boolean },
  ) {
    const userId = socket.data.userId as number;
    if (!userId) return;

    const receiverSockets = this.onlineUsers.get(data.receiverId);
    if (receiverSockets) {
      receiverSockets.forEach((socketId) => {
        this.server.to(socketId).emit('userTyping', {
          userId,
          isTyping: data.isTyping,
        });
      });
    }
  }

  sendSystemMessage(receiverId: number, content: string) {
    const receiverSockets = this.onlineUsers.get(receiverId);
    if (receiverSockets) {
      receiverSockets.forEach((socketId) => {
        this.server.to(socketId).emit('systemNotification', {
          type: 'system',
          content,
          timestamp: new Date().toISOString(),
        });
      });
    }
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineUserIds(): number[] {
    return Array.from(this.onlineUsers.keys());
  }
}
