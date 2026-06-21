import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BorrowService } from './borrow.service';
import { BorrowController } from './borrow.controller';
import { BorrowSchedulerService } from './borrow.scheduler';
import { Item } from './entities/item.entity';
import { BorrowRequest } from './entities/borrow-request.entity';
import { BorrowRecord } from './entities/borrow-record.entity';
import { User } from '../user/entities/user.entity';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, BorrowRequest, BorrowRecord, User]),
    forwardRef(() => MessageModule),
  ],
  controllers: [BorrowController],
  providers: [BorrowService, BorrowSchedulerService],
  exports: [BorrowService],
})
export class BorrowModule {}
