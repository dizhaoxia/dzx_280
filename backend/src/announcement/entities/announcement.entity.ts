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

export enum AnnouncementType {
  NOTICE = 'notice',
  EMERGENCY = 'emergency',
  ACTIVITY = 'activity',
}

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: AnnouncementType,
    default: AnnouncementType.NOTICE,
  })
  type: AnnouncementType;

  @Column({ default: true })
  isTop: boolean;

  @Column()
  publisherId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'publisherId' })
  publisher: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
