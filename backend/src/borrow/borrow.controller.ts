import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BorrowService } from './borrow.service';
import { BorrowSchedulerService } from './borrow.scheduler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import {
  CreateItemDto,
  UpdateItemDto,
  GetItemsDto,
  CreateBorrowRequestDto,
  ProcessBorrowRequestDto,
  ReturnItemDto,
  GetBorrowRequestsDto,
  GetBorrowRecordsDto,
} from './dto/borrow.dto';

@Controller('borrow')
@UseGuards(JwtAuthGuard)
export class BorrowController {
  constructor(
    private readonly borrowService: BorrowService,
    private readonly schedulerService: BorrowSchedulerService,
  ) {}

  @Get('statistics')
  getStatistics(@CurrentUser() user: User) {
    return this.borrowService.getStatistics(user.id);
  }

  @Post('item')
  createItem(@CurrentUser() user: User, @Body() dto: CreateItemDto) {
    return this.borrowService.createItem(user.id, dto);
  }

  @Put('item/:id')
  updateItem(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    return this.borrowService.updateItem(user.id, id, dto);
  }

  @Delete('item/:id')
  deleteItem(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.borrowService.deleteItem(user.id, id);
  }

  @Get('item/:id')
  getItemDetail(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.borrowService.getItemDetail(id, user.id);
  }

  @Get('items')
  getItemsList(@CurrentUser() user: User, @Query() dto: GetItemsDto) {
    return this.borrowService.getItemsList(user.id, dto);
  }

  @Get('my-items')
  getMyItems(@CurrentUser() user: User, @Query() dto: GetItemsDto) {
    return this.borrowService.getMyItems(user.id, dto);
  }

  @Post('upload-photo')
  @UseInterceptors(FileInterceptor('photo'))
  uploadItemPhoto(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.borrowService.uploadItemPhoto(user.id, file);
  }

  @Post('request')
  createBorrowRequest(@CurrentUser() user: User, @Body() dto: CreateBorrowRequestDto) {
    return this.borrowService.createBorrowRequest(user.id, dto);
  }

  @Get('request/:id')
  getBorrowRequestDetail(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.borrowService.getBorrowRequestDetail(id, user.id);
  }

  @Get('requests/borrower')
  getMyBorrowRequests(@CurrentUser() user: User, @Query() dto: GetBorrowRequestsDto) {
    return this.borrowService.getBorrowRequests(user.id, dto, 'borrower');
  }

  @Get('requests/owner')
  getReceivedBorrowRequests(@CurrentUser() user: User, @Query() dto: GetBorrowRequestsDto) {
    return this.borrowService.getBorrowRequests(user.id, dto, 'owner');
  }

  @Post('request/:id/process')
  processBorrowRequest(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessBorrowRequestDto,
  ) {
    return this.borrowService.processBorrowRequest(user.id, id, dto);
  }

  @Post('request/:id/cancel')
  cancelBorrowRequest(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.borrowService.cancelBorrowRequest(user.id, id);
  }

  @Get('record/:id')
  getBorrowRecordDetail(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.borrowService.getBorrowRecordDetail(id, user.id);
  }

  @Get('records/borrower')
  getMyBorrowRecords(@CurrentUser() user: User, @Query() dto: GetBorrowRecordsDto) {
    return this.borrowService.getBorrowRecords(user.id, dto, 'borrower');
  }

  @Get('records/owner')
  getMyLentRecords(@CurrentUser() user: User, @Query() dto: GetBorrowRecordsDto) {
    return this.borrowService.getBorrowRecords(user.id, dto, 'owner');
  }

  @Post('record/:id/return')
  returnItem(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnItemDto,
  ) {
    return this.borrowService.returnItem(user.id, id, dto);
  }

  @Post('admin/trigger-reminder')
  triggerReminderCheck() {
    return this.schedulerService.triggerReminderCheck();
  }

  @Post('admin/trigger-overdue')
  triggerOverdueCheck() {
    return this.schedulerService.triggerOverdueCheck();
  }
}
