import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { SendMessageDto, GetMessagesDto, CreateConversationDto } from './dto/message.dto';
import { ChatGateway } from './chat.gateway';

@Controller('message')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('conversations')
  getConversationList(@CurrentUser() user: User) {
    return this.messageService.getConversationList(user.id);
  }

  @Get(':conversationId/messages')
  getMessages(
    @CurrentUser() user: User,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query() dto: GetMessagesDto,
  ) {
    return this.messageService.getMessages(user.id, conversationId, dto);
  }

  @Post('send')
  sendMessage(@CurrentUser() user: User, @Body() dto: SendMessageDto) {
    return this.messageService.sendMessage(user.id, dto);
  }

  @Post(':conversationId/read')
  markAsRead(
    @CurrentUser() user: User,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.messageService.markAsRead(user.id, conversationId);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: User) {
    return this.messageService.getUnreadCount(user.id);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.messageService.uploadImage(user.id, file);
  }

  @Post('upload-audio')
  @UseInterceptors(FileInterceptor('audio'))
  uploadAudio(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.messageService.uploadAudio(user.id, file);
  }

  @Post('conversation')
  createOrGetConversation(
    @CurrentUser() user: User,
    @Body() dto: CreateConversationDto,
  ) {
    return this.messageService.createOrGetConversation(user.id, dto.targetUserId);
  }

  @Get('online-users')
  getOnlineUsers() {
    return { onlineUserIds: this.chatGateway.getOnlineUserIds() };
  }

  @Get('user-online/:userId')
  checkUserOnline(@Param('userId', ParseIntPipe) userId: number) {
    return { online: this.chatGateway.isUserOnline(userId) };
  }
}
