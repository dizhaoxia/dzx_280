import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { array: true })
  participantIds: number[];

  @Column({ nullable: true })
  lastMessage: string;

  @Column({ nullable: true })
  lastMessageTime: Date;

  @Column('json', { nullable: true })
  unreadCounts: Record<string, number>;

  @OneToMany(() => Message, (msg) => msg.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
