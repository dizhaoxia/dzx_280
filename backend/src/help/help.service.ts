import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { HelpPost } from './entities/help-post.entity';
import { CreateHelpPostDto, UpdateHelpPostDto, QueryHelpDto, UpdateHelpStatusDto } from './dto/help.dto';

@Injectable()
export class HelpService {
  constructor(
    @InjectRepository(HelpPost)
    private helpPostRepository: Repository<HelpPost>,
  ) {}

  async create(userId: number, data: CreateHelpPostDto, files?: Express.Multer.File[]) {
    let images = data.images;
    if (files && files.length > 0) {
      const fileUrls = files.map(file => `/uploads/${file.filename}`);
      images = fileUrls.join(',');
    }

    const post = this.helpPostRepository.create({
      ...data,
      userId,
      images,
    });

    return await this.helpPostRepository.save(post);
  }

  async findAll(filters: QueryHelpDto) {
    const { type, category, urgency, keyword, buildingId, page = 1, pageSize = 10 } = filters;

    const where: any = {};
    if (type) where.type = type;
    if (category) {
      if (Array.isArray(category)) {
        where.category = In(category);
      } else {
        where.category = category;
      }
    }
    if (urgency) where.urgency = urgency;
    if (buildingId) where.buildingId = buildingId;
    if (keyword) {
      where.title = Like(`%${keyword}%`);
    }

    const skip = (page - 1) * pageSize;

    const [list, total] = await this.helpPostRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
      relations: ['user', 'building'],
    });

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const post = await this.helpPostRepository.findOne({
      where: { id },
      relations: ['user', 'building'],
    });

    if (!post) {
      throw new NotFoundException('互助帖不存在');
    }

    post.viewCount += 1;
    await this.helpPostRepository.save(post);

    return post;
  }

  async update(id: number, userId: number, data: UpdateHelpPostDto) {
    const post = await this.helpPostRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('互助帖不存在');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('无权限修改此帖子');
    }

    Object.assign(post, data);
    return await this.helpPostRepository.save(post);
  }

  async remove(id: number, userId: number) {
    const post = await this.helpPostRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('互助帖不存在');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('无权限删除此帖子');
    }

    await this.helpPostRepository.remove(post);
    return { message: '删除成功' };
  }

  async updateStatus(id: number, userId: number, statusDto: UpdateHelpStatusDto) {
    const post = await this.helpPostRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('互助帖不存在');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('无权限修改此帖子状态');
    }

    post.status = statusDto.status;
    return await this.helpPostRepository.save(post);
  }
}
