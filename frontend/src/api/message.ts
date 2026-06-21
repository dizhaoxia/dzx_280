import request from '@/utils/request'

export function getConversations() {
  return request.get('/message/conversations')
}

export function getMessages(conversationId: number, params?: { page?: number; pageSize?: number }) {
  return request.get(`/message/${conversationId}/messages`, { params })
}

export function sendMessage(params: {
  receiverId: number
  type?: string
  content: string
  duration?: number
}) {
  return request.post('/message/send', params)
}

export function markAsRead(conversationId: number) {
  return request.post(`/message/${conversationId}/read`)
}

export function getUnreadCount() {
  return request.get('/message/unread-count')
}

export function uploadChatImage(formData: FormData) {
  return request.post('/message/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function uploadChatAudio(formData: FormData) {
  return request.post('/message/upload-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function createOrGetConversation(targetUserId: number) {
  return request.post('/message/conversation', { targetUserId })
}

export function getOnlineUsers() {
  return request.get('/message/online-users')
}

export function checkUserOnline(userId: number) {
  return request.get(`/message/user-online/${userId}`)
}
