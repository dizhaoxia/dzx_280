import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Building } from '../../building/entities/building.entity';

export enum VerifyStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PROPERTY = 'property',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 11 })
  phone: string;

  @Column()
  password: string;

  @Column({ nullable: true, length: 50 })
  nickname: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'user',
  })
  role: UserRole;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'unverified',
  })
  verifyStatus: VerifyStatus;

  @Column({ nullable: true })
  idCardFront: string;

  @Column({ nullable: true })
  idCardBack: string;

  @Column({ nullable: true, length: 50 })
  propertyCertNo: string;

  @Column({ nullable: true })
  buildingId: number;

  @ManyToOne(() => Building, { nullable: true })
  @JoinColumn({ name: 'buildingId' })
  building: Building;

  @Column({ nullable: true, length: 20 })
  roomNo: string;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 0 })
  unreadCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
