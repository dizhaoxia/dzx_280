import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { HelpModule } from './help/help.module';
import { MessageModule } from './message/message.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { BuildingModule } from './building/building.module';
import { User } from './user/entities/user.entity';
import { Building } from './building/entities/building.entity';
import { HelpPost } from './help/entities/help-post.entity';
import { Conversation } from './message/entities/conversation.entity';
import { Message } from './message/entities/message.entity';
import { Announcement } from './announcement/entities/announcement.entity';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(process.cwd(), 'data.db'),
      entities: [User, Building, HelpPost, Conversation, Message, Announcement],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UserModule,
    HelpModule,
    MessageModule,
    AnnouncementModule,
    BuildingModule,
  ],
})
export class AppModule {}
