import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpService } from './help.service';
import { HelpController } from './help.controller';
import { HelpPost } from './entities/help-post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HelpPost])],
  controllers: [HelpController],
  providers: [HelpService],
  exports: [HelpService],
})
export class HelpModule {}
