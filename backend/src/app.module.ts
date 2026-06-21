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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'neighborhood_help',
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
