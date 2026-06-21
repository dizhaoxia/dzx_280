import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { User } from '../user/entities/user.entity';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, User]),
    forwardRef(() => JwtModule),
  ],
  controllers: [MessageController],
  providers: [MessageService, ChatGateway],
  exports: [MessageService, ChatGateway],
})
export class MessageModule {}
