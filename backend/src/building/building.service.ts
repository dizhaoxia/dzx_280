import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './entities/building.entity';
import { CreateBuildingDto, UpdateBuildingDto } from './dto/building.dto';

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(Building)
    private buildingRepository: Repository<Building>,
  ) {}

  async findAll(): Promise<Building[]> {
    return this.buildingRepository.find({ where: { active: true } });
  }

  async findAllWithInactive(): Promise<Building[]> {
    return this.buildingRepository.find();
  }

  async create(data: CreateBuildingDto): Promise<Building> {
    const existing = await this.buildingRepository.findOne({ where: { code: data.code } });
    if (existing) {
      throw new ConflictException('楼栋编号已存在');
    }
    const building = this.buildingRepository.create(data);
    return this.buildingRepository.save(building);
  }

  async update(id: number, data: UpdateBuildingDto): Promise<Building> {
    const building = await this.buildingRepository.findOne({ where: { id } });
    if (!building) {
      throw new NotFoundException('楼栋不存在');
    }
    if (data.code && data.code !== building.code) {
      const existing = await this.buildingRepository.findOne({ where: { code: data.code } });
      if (existing) {
        throw new ConflictException('楼栋编号已存在');
      }
    }
    await this.buildingRepository.update(id, data);
    return this.buildingRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    const building = await this.buildingRepository.findOne({ where: { id } });
    if (!building) {
      throw new NotFoundException('楼栋不存在');
    }
    await this.buildingRepository.update(id, { active: false });
  }
}
