export interface User {
  id: number
  phone: string
  nickname?: string
  avatar?: string
  role: string
  verifyStatus: string
  idCardFront?: string
  idCardBack?: string
  propertyCertNo?: string
  buildingId?: number
  building?: Building
  roomNo?: string
  points: number
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface Building {
  id: number
  code: string
  name: string
  description?: string
  active: boolean
  createdAt: string
}

export interface HelpPost {
  id: number
  type: 'request' | 'offer'
  title: string
  content: string
  category: string
  urgency: 'normal' | 'urgent'
  buildingId?: number
  building?: Building
  locationDetail?: string
  status: string
  userId: number
  user: User
  images?: string
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: number
  participantIds: number[]
  lastMessage?: string
  lastMessageTime?: string
  unreadCounts?: Record<string, number>
  targetUser?: User
  createdAt: string
  updatedAt: string
}

export interface MessageItem {
  id: number
  conversationId: number
  senderId: number
  receiverId: number
  type: 'text' | 'image'
  content: string
  isRead: boolean
  createdAt: string
}

export interface Announcement {
  id: number
  title: string
  content: string
  type: 'notice' | 'emergency' | 'activity'
  isTop: boolean
  publisherId: number
  publisher: User
  createdAt: string
  updatedAt: string
}

export const HELP_CATEGORIES: { label: string; value: string }[] = [
  { label: '维修', value: 'repair' },
  { label: '照看', value: 'care' },
  { label: '代购', value: 'shopping' },
  { label: '宠物', value: 'pet' },
  { label: '快递', value: 'delivery' },
  { label: '其他', value: 'other' },
]

export const HELP_TYPES: { label: string; value: string }[] = [
  { label: '求帮助', value: 'request' },
  { label: '提供帮助', value: 'offer' },
]

export const URGENCY_LEVELS: { label: string; value: string }[] = [
  { label: '普通', value: 'normal' },
  { label: '紧急', value: 'urgent' },
]

export const VERIFY_STATUS: Record<string, string> = {
  unverified: '未认证',
  pending: '审核中',
  verified: '已认证',
  rejected: '已拒绝',
}

export const HELP_STATUS: Record<string, string> = {
  open: '进行中',
  in_progress: '处理中',
  completed: '已完成',
  cancelled: '已取消',
}
