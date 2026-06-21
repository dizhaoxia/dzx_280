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
import { Building } from '../../building/entities/building.entity';

export enum HelpType {
  REQUEST = 'request',
  OFFER = 'offer',
}

export enum HelpCategory {
  REPAIR = 'repair',
  CARE = 'care',
  SHOPPING = 'shopping',
  PET = 'pet',
  DELIVERY = 'delivery',
  OTHER = 'other',
}

export enum UrgencyLevel {
  NORMAL = 'normal',
  URGENT = 'urgent',
}

export enum HelpStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('help_posts')
export class HelpPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 20,
  })
  type: HelpType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    length: 30,
  })
  category: HelpCategory;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'normal',
  })
  urgency: UrgencyLevel;

  @Column({ nullable: true })
  buildingId: number;

  @ManyToOne(() => Building, { nullable: true })
  @JoinColumn({ name: 'buildingId' })
  building: Building;

  @Column({ length: 200, nullable: true })
  locationDetail: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'open',
  })
  status: HelpStatus;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true, length: 500 })
  images: string;

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
