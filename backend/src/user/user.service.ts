import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, VerifyStatus } from './entities/user.entity';
import { UpdateProfileDto, VerifyByPropertyDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['building'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async updateProfile(userId: number, data: UpdateProfileDto): Promise<User> {
    await this.userRepository.update(userId, data);
    return this.findById(userId);
  }

  async verifyByIdCard(
    userId: number,
    files: { idCardFront?: Express.Multer.File[]; idCardBack?: Express.Multer.File[] },
  ): Promise<User> {
    const idCardFront = files.idCardFront?.[0]?.path;
    const idCardBack = files.idCardBack?.[0]?.path;

    await this.userRepository.update(userId, {
      idCardFront,
      idCardBack,
      verifyStatus: VerifyStatus.PENDING,
    });
    return this.findById(userId);
  }

  async verifyByProperty(userId: number, data: VerifyByPropertyDto): Promise<User> {
    await this.userRepository.update(userId, {
      propertyCertNo: data.propertyCertNo,
      buildingId: data.buildingId,
      roomNo: data.roomNo,
      verifyStatus: VerifyStatus.VERIFIED,
    });
    return this.findById(userId);
  }

  async updateUnreadCount(userId: number, count: number): Promise<User> {
    await this.userRepository.update(userId, { unreadCount: count });
    return this.findById(userId);
  }
}
