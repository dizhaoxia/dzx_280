import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, In, Like, Brackets } from 'typeorm';
import { Item, ItemStatus, ItemCondition } from './entities/item.entity';
import { BorrowRequest, BorrowRequestStatus } from './entities/borrow-request.entity';
import { BorrowRecord, BorrowRecordStatus } from './entities/borrow-record.entity';
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
import * as fs from 'fs';
import * as path from 'path';
import { ChatGateway } from '../message/chat.gateway';
import { MessageService } from '../message/message.service';

@Injectable()
export class BorrowService {
  private readonly logger = new Logger(BorrowService.name);

  constructor(
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(BorrowRequest)
    private borrowRequestRepository: Repository<BorrowRequest>,
    @InjectRepository(BorrowRecord)
    private borrowRecordRepository: Repository<BorrowRecord>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
  ) {}

  async createItem(userId: number, dto: CreateItemDto) {
    const item = this.itemRepository.create({
      ...dto,
      ownerId: userId,
      status: ItemStatus.AVAILABLE,
    });

    const savedItem = await this.itemRepository.save(item);

    return this.getItemDetail(savedItem.id, userId);
  }

  async updateItem(userId: number, itemId: number, dto: UpdateItemDto) {
    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('物品不存在');
    }
    if (item.ownerId !== userId) {
      throw new ForbiddenException('无权修改该物品');
    }

    Object.assign(item, dto);
    await this.itemRepository.save(item);

    return this.getItemDetail(itemId, userId);
  }

  async deleteItem(userId: number, itemId: number) {
    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('物品不存在');
    }
    if (item.ownerId !== userId) {
      throw new ForbiddenException('无权删除该物品');
    }
    if (item.status === ItemStatus.BORROWED) {
      throw new BadRequestException('物品正在借用中，无法删除');
    }

    await this.itemRepository.delete(itemId);
    return { success: true };
  }

  async getItemDetail(itemId: number, currentUserId?: number) {
    const item = await this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.owner', 'owner')
      .where('item.id = :itemId', { itemId })
      .getOne();

    if (!item) {
      throw new NotFoundException('物品不存在');
    }

    const { owner, ...rest } = item;
    const ownerInfo = owner
      ? {
          id: owner.id,
          nickname: owner.nickname,
          avatar: owner.avatar,
          phone: owner.phone,
          roomNo: owner.roomNo,
        }
      : null;

    const isOwner = currentUserId === owner?.id;
    const online = currentUserId ? this.chatGateway.isUserOnline(owner?.id) : false;

    return {
      ...rest,
      owner: ownerInfo,
      isOwner,
      ownerOnline: online,
    };
  }

  async getItemsList(userId: number, dto: GetItemsDto) {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.owner', 'owner')
      .where('1 = 1');

    if (dto.keyword) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('item.name LIKE :keyword', { keyword: `%${dto.keyword}%` }).orWhere(
            'item.description LIKE :keyword',
            { keyword: `%${dto.keyword}%` },
          );
        }),
      );
    }

    if (dto.ownerId) {
      queryBuilder.andWhere('item.ownerId = :ownerId', { ownerId: dto.ownerId });
    }

    if (dto.buildingId) {
      queryBuilder.andWhere('item.buildingId = :buildingId', { buildingId: dto.buildingId });
    }

    if (dto.status) {
      queryBuilder.andWhere('item.status = :status', { status: dto.status });
    }

    if (dto.condition) {
      queryBuilder.andWhere('item.condition = :condition', { condition: dto.condition });
    }

    queryBuilder.orderBy('item.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    const list = items.map((item) => {
      const { owner, ...rest } = item;
      const online = this.chatGateway.isUserOnline(owner?.id);
      return {
        ...rest,
        owner: owner
          ? {
              id: owner.id,
              nickname: owner.nickname,
              avatar: owner.avatar,
              online,
            }
          : null,
        isOwner: owner?.id === userId,
      };
    });

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async getMyItems(userId: number, dto: GetItemsDto) {
    return this.getItemsList(userId, { ...dto, ownerId: userId });
  }

  async uploadItemPhoto(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'items');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.png';
    const filename = `item_${userId}_${timestamp}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    return { url: `/uploads/items/${filename}` };
  }

  async createBorrowRequest(userId: number, dto: CreateBorrowRequestDto) {
    const item = await this.itemRepository.findOne({ where: { id: dto.itemId } });
    if (!item) {
      throw new NotFoundException('物品不存在');
    }
    if (item.ownerId === userId) {
      throw new BadRequestException('不能借用自己的物品');
    }
    if (item.status !== ItemStatus.AVAILABLE) {
      throw new BadRequestException('该物品当前不可借用');
    }

    const startDate = new Date(dto.expectedStartDate);
    const endDate = new Date(dto.expectedEndDate);

    if (startDate >= endDate) {
      throw new BadRequestException('归还时间必须晚于借用时间');
    }
    if (startDate < new Date()) {
      throw new BadRequestException('借用时间不能早于当前时间');
    }

    const pendingRequest = await this.borrowRequestRepository.findOne({
      where: {
        itemId: dto.itemId,
        borrowerId: userId,
        status: BorrowRequestStatus.PENDING,
      },
    });
    if (pendingRequest) {
      throw new BadRequestException('您已经提交了借用申请，请等待审批');
    }

    const request = this.borrowRequestRepository.create({
      itemId: dto.itemId,
      borrowerId: userId,
      ownerId: item.ownerId,
      expectedStartDate: startDate,
      expectedEndDate: endDate,
      remark: dto.remark,
      status: BorrowRequestStatus.PENDING,
    });

    const savedRequest = await this.borrowRequestRepository.save(request);

    try {
      const notificationContent = `收到新的借用申请：${item.name}`;
      this.chatGateway.sendSystemMessage(item.ownerId, notificationContent);
      await this.messageService.sendSystemMessage(null, item.ownerId, notificationContent);
    } catch (e) {
      this.logger.error('发送借用申请通知失败', e);
    }

    return this.getBorrowRequestDetail(savedRequest.id, userId);
  }

  async getBorrowRequestDetail(requestId: number, userId: number) {
    const request = await this.borrowRequestRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.item', 'item')
      .leftJoinAndSelect('req.borrower', 'borrower')
      .leftJoinAndSelect('req.owner', 'owner')
      .where('req.id = :requestId', { requestId })
      .getOne();

    if (!request) {
      throw new NotFoundException('申请不存在');
    }
    if (request.borrowerId !== userId && request.ownerId !== userId) {
      throw new ForbiddenException('无权查看该申请');
    }

    const { item, borrower, owner, ...rest } = request;
    return {
      ...rest,
      item: item
        ? {
            id: item.id,
            name: item.name,
            photos: item.photos,
            deposit: item.deposit,
            isFreeDeposit: item.isFreeDeposit,
          }
        : null,
      borrower: borrower
        ? {
            id: borrower.id,
            nickname: borrower.nickname,
            avatar: borrower.avatar,
            phone: borrower.phone,
            roomNo: borrower.roomNo,
          }
        : null,
      owner: owner
        ? {
            id: owner.id,
            nickname: owner.nickname,
            avatar: owner.avatar,
          }
        : null,
    };
  }

  async getBorrowRequests(userId: number, dto: GetBorrowRequestsDto, role: 'borrower' | 'owner' = 'borrower') {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.borrowRequestRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.item', 'item')
      .leftJoinAndSelect('req.borrower', 'borrower')
      .leftJoinAndSelect('req.owner', 'owner');

    if (role === 'borrower') {
      queryBuilder.where('req.borrowerId = :userId', { userId });
    } else {
      queryBuilder.where('req.ownerId = :userId', { userId });
    }

    if (dto.status) {
      queryBuilder.andWhere('req.status = :status', { status: dto.status });
    }

    if (dto.itemId) {
      queryBuilder.andWhere('req.itemId = :itemId', { itemId: dto.itemId });
    }

    queryBuilder.orderBy('req.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [requests, total] = await queryBuilder.getManyAndCount();

    const list = requests.map((req) => {
      const { item, borrower, owner, ...rest } = req;
      return {
        ...rest,
        item: item
          ? {
              id: item.id,
              name: item.name,
              photos: item.photos,
            }
          : null,
        borrower: borrower
          ? {
              id: borrower.id,
              nickname: borrower.nickname,
              avatar: borrower.avatar,
            }
          : null,
        owner: owner
          ? {
              id: owner.id,
              nickname: owner.nickname,
              avatar: owner.avatar,
            }
          : null,
      };
    });

    return { list, total, page, pageSize };
  }

  async processBorrowRequest(userId: number, requestId: number, dto: ProcessBorrowRequestDto) {
    const request = await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ['item', 'borrower'],
    });
    if (!request) {
      throw new NotFoundException('申请不存在');
    }
    if (request.ownerId !== userId) {
      throw new ForbiddenException('无权处理该申请');
    }
    if (request.status !== BorrowRequestStatus.PENDING) {
      throw new BadRequestException('该申请已被处理');
    }

    if (dto.status === BorrowRequestStatus.APPROVED) {
      const activeBorrow = await this.borrowRecordRepository.findOne({
        where: {
          itemId: request.itemId,
          status: In([BorrowRecordStatus.BORROWING, BorrowRecordStatus.OVERDUE]),
        },
      });
      if (activeBorrow) {
        throw new BadRequestException('该物品已被借出，请稍后再试');
      }

      request.status = BorrowRequestStatus.APPROVED;
      await this.borrowRequestRepository.save(request);

      const record = this.borrowRecordRepository.create({
        itemId: request.itemId,
        borrowerId: request.borrowerId,
        ownerId: request.ownerId,
        requestId: request.id,
        startDate: request.expectedStartDate,
        expectedReturnDate: request.expectedEndDate,
        deposit: request.item?.deposit || 0,
        status: BorrowRecordStatus.BORROWING,
      });
      const savedRecord = await this.borrowRecordRepository.save(record);

      if (request.item) {
        request.item.status = ItemStatus.BORROWED;
        await this.itemRepository.save(request.item);
      }

      try {
        const notificationContent = `您的借用申请已通过：${request.item?.name}`;
        this.chatGateway.sendSystemMessage(request.borrowerId, notificationContent);
        await this.messageService.sendSystemMessage(null, request.borrowerId, notificationContent);
      } catch (e) {
        this.logger.error('发送审批通过通知失败', e);
      }

      return this.getBorrowRecordDetail(savedRecord.id, userId);
    } else if (dto.status === BorrowRequestStatus.REJECTED) {
      request.status = BorrowRequestStatus.REJECTED;
      request.rejectReason = dto.rejectReason || '物品暂不可借用';
      await this.borrowRequestRepository.save(request);

      try {
        const notificationContent = `您的借用申请被拒绝：${request.item?.name}，原因：${request.rejectReason}`;
        this.chatGateway.sendSystemMessage(request.borrowerId, notificationContent);
        await this.messageService.sendSystemMessage(null, request.borrowerId, notificationContent);
      } catch (e) {
        this.logger.error('发送审批拒绝通知失败', e);
      }

      return { success: true };
    } else {
      throw new BadRequestException('无效的处理状态');
    }
  }

  async cancelBorrowRequest(userId: number, requestId: number) {
    const request = await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ['item'],
    });
    if (!request) {
      throw new NotFoundException('申请不存在');
    }
    if (request.borrowerId !== userId) {
      throw new ForbiddenException('无权取消该申请');
    }
    if (request.status !== BorrowRequestStatus.PENDING) {
      throw new BadRequestException('该申请已被处理，无法取消');
    }

    request.status = BorrowRequestStatus.CANCELLED;
    await this.borrowRequestRepository.save(request);

    try {
      const notificationContent = `借用申请已被取消：${request.item?.name}`;
      this.chatGateway.sendSystemMessage(request.ownerId, notificationContent);
      await this.messageService.sendSystemMessage(null, request.ownerId, notificationContent);
    } catch (e) {
      this.logger.error('发送取消申请通知失败', e);
    }

    return { success: true };
  }

  async getBorrowRecordDetail(recordId: number, userId: number) {
    const record = await this.borrowRecordRepository
      .createQueryBuilder('rec')
      .leftJoinAndSelect('rec.item', 'item')
      .leftJoinAndSelect('rec.borrower', 'borrower')
      .leftJoinAndSelect('rec.owner', 'owner')
      .where('rec.id = :recordId', { recordId })
      .getOne();

    if (!record) {
      throw new NotFoundException('记录不存在');
    }
    if (record.borrowerId !== userId && record.ownerId !== userId) {
      throw new ForbiddenException('无权查看该记录');
    }

    const { item, borrower, owner, ...rest } = record;
    return {
      ...rest,
      item: item
        ? {
            id: item.id,
            name: item.name,
            photos: item.photos,
          }
        : null,
      borrower: borrower
        ? {
            id: borrower.id,
            nickname: borrower.nickname,
            avatar: borrower.avatar,
            phone: borrower.phone,
            roomNo: borrower.roomNo,
          }
        : null,
      owner: owner
        ? {
            id: owner.id,
            nickname: owner.nickname,
            avatar: owner.avatar,
          }
        : null,
    };
  }

  async getBorrowRecords(userId: number, dto: GetBorrowRecordsDto, role: 'borrower' | 'owner' = 'borrower') {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.borrowRecordRepository
      .createQueryBuilder('rec')
      .leftJoinAndSelect('rec.item', 'item')
      .leftJoinAndSelect('rec.borrower', 'borrower')
      .leftJoinAndSelect('rec.owner', 'owner');

    if (role === 'borrower') {
      queryBuilder.where('rec.borrowerId = :userId', { userId });
    } else {
      queryBuilder.where('rec.ownerId = :userId', { userId });
    }

    if (dto.status) {
      queryBuilder.andWhere('rec.status = :status', { status: dto.status });
    }

    if (dto.itemId) {
      queryBuilder.andWhere('rec.itemId = :itemId', { itemId: dto.itemId });
    }

    queryBuilder.orderBy('rec.createdAt', 'DESC');
    queryBuilder.skip(skip).take(pageSize);

    const [records, total] = await queryBuilder.getManyAndCount();

    const list = records.map((rec) => {
      const { item, borrower, owner, ...rest } = rec;
      return {
        ...rest,
        item: item
          ? {
              id: item.id,
              name: item.name,
              photos: item.photos,
            }
          : null,
        borrower: borrower
          ? {
              id: borrower.id,
              nickname: borrower.nickname,
              avatar: borrower.avatar,
            }
          : null,
        owner: owner
          ? {
              id: owner.id,
              nickname: owner.nickname,
              avatar: owner.avatar,
            }
          : null,
      };
    });

    return { list, total, page, pageSize };
  }

  async returnItem(userId: number, recordId: number, dto: ReturnItemDto) {
    const record = await this.borrowRecordRepository.findOne({
      where: { id: recordId },
      relations: ['item'],
    });
    if (!record) {
      throw new NotFoundException('记录不存在');
    }
    if (record.ownerId !== userId) {
      throw new ForbiddenException('无权确认归还');
    }
    if (record.status !== BorrowRecordStatus.BORROWING && record.status !== BorrowRecordStatus.OVERDUE) {
      throw new BadRequestException('该借用记录无法确认归还');
    }

    record.status = BorrowRecordStatus.RETURNED;
    record.actualReturnDate = new Date();
    record.returnRemark = dto.returnRemark;
    record.actualDamageCost = dto.actualDamageCost || 0;
    await this.borrowRecordRepository.save(record);

    if (record.item) {
      record.item.status = ItemStatus.AVAILABLE;
      await this.itemRepository.save(record.item);
    }

    const notificationContent = `物品已确认归还：${record.item?.name}`;
    this.chatGateway.sendSystemMessage(record.borrowerId, notificationContent);
    await this.messageService.sendSystemMessage(null, record.borrowerId, notificationContent);

    return { success: true };
  }

  async checkReturnReminders() {
    this.logger.log('开始检查归还提醒...');

    const now = new Date();
    const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const records = await this.borrowRecordRepository
      .createQueryBuilder('rec')
      .leftJoinAndSelect('rec.item', 'item')
      .where('rec.status IN (:...statuses)', {
        statuses: [BorrowRecordStatus.BORROWING, BorrowRecordStatus.OVERDUE],
      })
      .andWhere('rec.reminderSent = :reminderSent', { reminderSent: false })
      .andWhere('rec.expectedReturnDate <= :reminderTime', { reminderTime })
      .andWhere('rec.expectedReturnDate > :now', { now })
      .getMany();

    for (const record of records) {
      try {
        const itemName = record.item?.name || '物品';
        const timeLeft = Math.ceil(
          (new Date(record.expectedReturnDate).getTime() - now.getTime()) / (60 * 60 * 1000),
        );

        const notificationContent = `归还提醒：您借用的【${itemName}】将在约${timeLeft}小时后到期，请及时归还`;

        this.chatGateway.sendSystemMessage(record.borrowerId, notificationContent);
        await this.messageService.sendSystemMessage(null, record.borrowerId, notificationContent);

        record.reminderSent = true;
        await this.borrowRecordRepository.save(record);

        this.logger.log(`已发送归还提醒给用户 ${record.borrowerId}，物品：${itemName}`);
      } catch (error) {
        this.logger.error(`发送归还提醒失败，recordId: ${record.id}`, error);
      }
    }

    this.logger.log(`归还提醒检查完成，本次处理 ${records.length} 条记录`);
  }

  async checkOverdueItems() {
    this.logger.log('开始检查逾期物品...');

    const now = new Date();

    const records = await this.borrowRecordRepository
      .createQueryBuilder('rec')
      .leftJoinAndSelect('rec.item', 'item')
      .where('rec.status = :status', { status: BorrowRecordStatus.BORROWING })
      .andWhere('rec.expectedReturnDate < :now', { now })
      .getMany();

    for (const record of records) {
      try {
        record.status = BorrowRecordStatus.OVERDUE;
        await this.borrowRecordRepository.save(record);

        const itemName = record.item?.name || '物品';
        const notificationContent = `逾期提醒：您借用的【${itemName}】已超过归还时间，请尽快归还`;

        this.chatGateway.sendSystemMessage(record.borrowerId, notificationContent);
        await this.messageService.sendSystemMessage(null, record.borrowerId, notificationContent);

        this.logger.log(`已标记逾期并发送提醒给用户 ${record.borrowerId}，物品：${itemName}`);
      } catch (error) {
        this.logger.error(`处理逾期失败，recordId: ${record.id}`, error);
      }
    }

    this.logger.log(`逾期检查完成，本次处理 ${records.length} 条记录`);
  }

  getStatistics(userId: number) {
    return Promise.all([
      this.itemRepository.count({ where: { ownerId: userId } }),
      this.borrowRequestRepository.count({
        where: { ownerId: userId, status: BorrowRequestStatus.PENDING },
      }),
      this.borrowRecordRepository.count({
        where: { ownerId: userId, status: BorrowRecordStatus.BORROWING },
      }),
      this.borrowRecordRepository.count({
        where: { borrowerId: userId, status: BorrowRecordStatus.BORROWING },
      }),
      this.borrowRecordRepository.count({
        where: { borrowerId: userId, status: BorrowRecordStatus.OVERDUE },
      }),
    ]).then(([myItems, pendingRequests, lendingOut, borrowing, overdue]) => ({
      myItems,
      pendingRequests,
      lendingOut,
      borrowing,
      overdue,
    }));
  }
}
