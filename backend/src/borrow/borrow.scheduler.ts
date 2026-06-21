import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { BorrowService } from './borrow.service';

@Injectable()
export class BorrowSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BorrowSchedulerService.name);
  private reminderTimer: any = null;
  private overdueTimer: any = null;

  constructor(private readonly borrowService: BorrowService) {}

  onModuleInit() {
    this.startSchedulers();
  }

  onModuleDestroy() {
    this.stopSchedulers();
  }

  private startSchedulers() {
    this.logger.log('启动借用定时任务调度器...');

    this.reminderTimer = setInterval(() => {
      this.borrowService.checkReturnReminders().catch((err) => {
        this.logger.error('归还提醒任务执行失败', err);
      });
    }, 60 * 60 * 1000);

    this.overdueTimer = setInterval(() => {
      this.borrowService.checkOverdueItems().catch((err) => {
        this.logger.error('逾期检查任务执行失败', err);
      });
    }, 60 * 60 * 1000);

    setTimeout(() => {
      this.borrowService.checkReturnReminders().catch((err) => {
        this.logger.error('初始归还提醒任务执行失败', err);
      });
      this.borrowService.checkOverdueItems().catch((err) => {
        this.logger.error('初始逾期检查任务执行失败', err);
      });
    }, 5000);

    this.logger.log('借用定时任务调度器已启动');
  }

  private stopSchedulers() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      this.reminderTimer = null;
    }
    if (this.overdueTimer) {
      clearInterval(this.overdueTimer);
      this.overdueTimer = null;
    }
    this.logger.log('借用定时任务调度器已停止');
  }

  async triggerReminderCheck() {
    await this.borrowService.checkReturnReminders();
    return { success: true, message: '归还提醒检查已触发' };
  }

  async triggerOverdueCheck() {
    await this.borrowService.checkOverdueItems();
    return { success: true, message: '逾期检查已触发' };
  }
}
