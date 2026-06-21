import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../../user/entities/user.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  SYSTEM = 'system',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  conversationId: number;

  @ManyToOne(() => Conversation, (conv) => conv.messages)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  senderId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  receiverId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'text',
  })
  type: MessageType;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  duration: number;

  @CreateDateColumn()
  createdAt: Date;
}
