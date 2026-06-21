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
import { Item } from './item.entity';

export enum BorrowRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('borrow_requests')
export class BorrowRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  itemId: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column()
  borrowerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'borrowerId' })
  borrower: User;

  @Column()
  ownerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'datetime' })
  expectedStartDate: Date;

  @Column({ type: 'datetime' })
  expectedEndDate: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: BorrowRequestStatus;

  @Column({ type: 'text', nullable: true })
  rejectReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
