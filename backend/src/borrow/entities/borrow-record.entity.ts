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

export enum BorrowRecordStatus {
  BORROWING = 'borrowing',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  LOST = 'lost',
}

@Entity('borrow_records')
export class BorrowRecord {
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

  @Column({ nullable: true })
  requestId: number;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime' })
  expectedReturnDate: Date;

  @Column({ type: 'datetime', nullable: true })
  actualReturnDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deposit: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  actualDamageCost: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'borrowing',
  })
  status: BorrowRecordStatus;

  @Column({ type: 'text', nullable: true })
  returnRemark: string;

  @Column({ default: false })
  reminderSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
