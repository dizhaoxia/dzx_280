import { io, Socket } from 'socket.io-client'
import { useUserStore } from '@/stores/user'
import { ref } from 'vue'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectTimer: any = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10

  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:32032'
  }

  public isConnected = ref(false)
  public onlineUserIds = ref<number[]>([])
  public onMessageCallbacks: Array<(msg: any) => void> = []
  public onConversationCallbacks: Array<(data: any) => void> = []
  public onSystemNotificationCallbacks: Array<(data: any) => void> = []
  public onTypingCallbacks: Array<(data: any) => void> = []

  connect() {
    const userStore = useUserStore()
    const token = userStore.token

    if (!token) {
      console.warn('WebSocket: 未登录，跳过连接')
      return
    }

    if (this.socket && this.socket.connected) {
      console.log('WebSocket: 已连接')
      return
    }

    try {
      const baseUrl = this.getBaseUrl()
      this.socket = io(`${baseUrl}/chat`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: false,
        timeout: 10000,
      })

      this.socket.on('connect', () => {
        console.log('WebSocket: 连接成功')
        this.isConnected.value = true
        this.reconnectAttempts = 0
        this.getOnlineUsers()
      })

      this.socket.on('disconnect', () => {
        console.log('WebSocket: 断开连接')
        this.isConnected.value = false
        this.scheduleReconnect()
      })

      this.socket.on('connect_error', (error: any) => {
        console.error('WebSocket: 连接错误', error)
        this.isConnected.value = false
        this.scheduleReconnect()
      })

      this.socket.on('connected', (data: any) => {
        console.log('WebSocket: 服务器确认连接', data)
      })

      this.socket.on('onlineStatus', (data: any) => {
        this.onlineUserIds.value = data.onlineUserIds || []
      })

      this.socket.on('onlineUsers', (data: any) => {
        this.onlineUserIds.value = data.onlineUserIds || []
      })

      this.socket.on('newMessage', (message: any) => {
        this.onMessageCallbacks.forEach((cb) => cb(message))
      })

      this.socket.on('conversationUpdate', (data: any) => {
        this.onConversationCallbacks.forEach((cb) => cb(data))
      })

      this.socket.on('systemNotification', (data: any) => {
        this.onSystemNotificationCallbacks.forEach((cb) => cb(data))
      })

      this.socket.on('userTyping', (data: any) => {
        this.onTypingCallbacks.forEach((cb) => cb(data))
      })

      this.socket.on('messageSent', (data: any) => {
        console.log('WebSocket: 消息发送成功', data)
      })

      this.socket.on('messageError', (data: any) => {
        console.error('WebSocket: 消息发送失败', data)
      })
    } catch (error) {
      console.error('WebSocket: 创建连接失败', error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('WebSocket: 达到最大重连次数，停止重连')
      return
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

    console.log(`WebSocket: ${delay / 1000}秒后尝试第${this.reconnectAttempts}次重连`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.isConnected.value = false
    this.onlineUserIds.value = []
    console.log('WebSocket: 已手动断开')
  }

  getSocket(): Socket | null {
    return this.socket
  }

  sendMessage(data: {
    receiverId: number
    type?: string
    content: string
    duration?: number
    conversationId?: number
  }) {
    if (!this.socket || !this.socket.connected) {
      console.warn('WebSocket: 未连接，无法发送消息')
      return false
    }

    this.socket.emit('sendMessage', data)
    return true
  }

  markAsRead(conversationId: number) {
    if (!this.socket || !this.socket.connected) {
      return false
    }

    this.socket.emit('markAsRead', { conversationId })
    return true
  }

  sendTyping(receiverId: number, isTyping: boolean) {
    if (!this.socket || !this.socket.connected) {
      return false
    }

    this.socket.emit('typing', { receiverId, isTyping })
    return true
  }

  getOnlineUsers() {
    if (!this.socket || !this.socket.connected) {
      return
    }

    this.socket.emit('getOnlineUsers')
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUserIds.value.includes(userId)
  }

  onMessage(callback: (msg: any) => void) {
    this.onMessageCallbacks.push(callback)
    return () => {
      const index = this.onMessageCallbacks.indexOf(callback)
      if (index > -1) {
        this.onMessageCallbacks.splice(index, 1)
      }
    }
  }

  onConversationUpdate(callback: (data: any) => void) {
    this.onConversationCallbacks.push(callback)
    return () => {
      const index = this.onConversationCallbacks.indexOf(callback)
      if (index > -1) {
        this.onConversationCallbacks.splice(index, 1)
      }
    }
  }

  onSystemNotification(callback: (data: any) => void) {
    this.onSystemNotificationCallbacks.push(callback)
    return () => {
      const index = this.onSystemNotificationCallbacks.indexOf(callback)
      if (index > -1) {
        this.onSystemNotificationCallbacks.splice(index, 1)
      }
    }
  }

  onUserTyping(callback: (data: any) => void) {
    this.onTypingCallbacks.push(callback)
    return () => {
      const index = this.onTypingCallbacks.indexOf(callback)
      if (index > -1) {
        this.onTypingCallbacks.splice(index, 1)
      }
    }
  }
}

export const websocketService = new WebSocketService()
