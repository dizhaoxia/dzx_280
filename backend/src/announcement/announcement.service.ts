import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
  ) {}

  async create(userId: number, data: CreateAnnouncementDto) {
    const announcement = this.announcementRepository.create({
      ...data,
      publisherId: userId,
    });

    return await this.announcementRepository.save(announcement);
  }

  async findAll() {
    return await this.announcementRepository.find({
      order: {
        isTop: 'DESC',
        createdAt: 'DESC',
      },
      relations: ['publisher'],
    });
  }

  async findOne(id: number) {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['publisher'],
    });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    return announcement;
  }

  async update(id: number, data: UpdateAnnouncementDto) {
    const announcement = await this.announcementRepository.findOne({ where: { id } });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    Object.assign(announcement, data);
    return await this.announcementRepository.save(announcement);
  }

  async remove(id: number) {
    const announcement = await this.announcementRepository.findOne({ where: { id } });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    await this.announcementRepository.remove(announcement);
    return { message: '删除成功' };
  }
}
