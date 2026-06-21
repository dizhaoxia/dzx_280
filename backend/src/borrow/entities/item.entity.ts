import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum ItemCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export enum ItemStatus {
  AVAILABLE = 'available',
  BORROWED = 'borrowed',
  RESERVED = 'reserved',
  UNAVAILABLE = 'unavailable',
}

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  photos: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'good',
  })
  condition: ItemCondition;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deposit: number;

  @Column({ default: false })
  isFreeDeposit: boolean;

  @Column({ type: 'text', nullable: true })
  availableSlots: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'available',
  })
  status: ItemStatus;

  @Column()
  ownerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ nullable: true })
  buildingId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
