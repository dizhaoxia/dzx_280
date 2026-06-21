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
  type: 'text' | 'image' | 'audio' | 'system'
  content: string
  isRead: boolean
  duration?: number
  createdAt: string
  sender?: User
  receiver?: User
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

export interface Item {
  id: number
  name: string
  description?: string
  photos?: string
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  deposit: number
  isFreeDeposit: boolean
  availableSlots?: string
  status: 'available' | 'borrowed' | 'reserved' | 'unavailable'
  ownerId: number
  owner?: User
  buildingId?: number
  createdAt: string
  updatedAt: string
  isOwner?: boolean
  ownerOnline?: boolean
}

export interface BorrowRequest {
  id: number
  itemId: number
  item?: Item
  borrowerId: number
  borrower?: User
  ownerId: number
  owner?: User
  remark?: string
  expectedStartDate: string
  expectedEndDate: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  rejectReason?: string
  createdAt: string
  updatedAt: string
}

export interface BorrowRecord {
  id: number
  itemId: number
  item?: Item
  borrowerId: number
  borrower?: User
  ownerId: number
  owner?: User
  requestId?: number
  startDate: string
  expectedReturnDate: string
  actualReturnDate?: string
  deposit: number
  actualDamageCost: number
  status: 'borrowing' | 'returned' | 'overdue' | 'lost'
  returnRemark?: string
  reminderSent: boolean
  createdAt: string
  updatedAt: string
}

export const ITEM_CONDITION_OPTIONS: { label: string; value: string }[] = [
  { label: '全新', value: 'new' },
  { label: '几乎全新', value: 'like_new' },
  { label: '良好', value: 'good' },
  { label: '一般', value: 'fair' },
  { label: '较旧', value: 'poor' },
]

export const ITEM_STATUS: Record<string, string> = {
  available: '可借用',
  borrowed: '已借出',
  reserved: '已预约',
  unavailable: '不可用',
}

export const BORROW_REQUEST_STATUS: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  cancelled: '已取消',
}

export const BORROW_RECORD_STATUS: Record<string, string> = {
  borrowing: '借用中',
  returned: '已归还',
  overdue: '已逾期',
  lost: '已丢失',
}
