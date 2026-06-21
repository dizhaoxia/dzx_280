<template>
  <div class="h-full flex flex-col min-h-0 overflow-hidden">
    <div class="h-14 px-4 flex items-center bg-white border-b border-gray-200 flex-none">
      <n-avatar round size="medium" :src="targetUser?.avatar">
        {{ targetUser?.nickname?.charAt(0) || targetUser?.phone?.slice(-4) }}
      </n-avatar>
      <div class="ml-3 flex-1">
        <div class="flex items-center gap-2">
          <span class="font-medium text-gray-800">
            {{ targetUser?.nickname || targetUser?.phone }}
          </span>
          <span
            v-if="targetUser && isTargetOnline"
            class="flex items-center gap-1 text-xs text-green-500"
          >
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            在线
          </span>
          <span v-else-if="targetUser" class="flex items-center gap-1 text-xs text-gray-400">
            <span class="w-2 h-2 rounded-full bg-gray-400"></span>
            离线
          </span>
          <n-tag v-if="targetUser?.verifyStatus === 'verified'" size="small" type="success" round>
            已认证
          </n-tag>
          <n-tag v-else-if="targetUser?.verifyStatus === 'pending'" size="small" type="warning" round>
            审核中
          </n-tag>
          <n-tag v-else size="small" type="default" round>
            未认证
          </n-tag>
        </div>
        <div v-if="isTyping" class="text-xs text-gray-400 mt-0.5">
          对方正在输入...
        </div>
      </div>
    </div>

    <n-scrollbar ref="scrollbarRef" class="flex-1 p-4 min-h-0">
      <div v-if="loading" class="h-full flex items-center justify-center">
        <n-spin />
      </div>
      <div v-else-if="messages.length === 0" class="h-full flex items-center justify-center">
        <p class="text-gray-400 text-sm">暂无消息，开始聊天吧</p>
      </div>
      <div v-else class="flex flex-col gap-4">
        <div
          v-for="(msg, index) in messages"
          :key="msg.id || `temp-${index}`"
          class="flex"
          :class="isSelf(msg.senderId) ? 'justify-end' : 'justify-start'"
        >
          <template v-if="msg.type === 'system'">
            <div class="w-full flex justify-center my-2">
              <n-tag size="small" type="info" round class="bg-blue-50">
                {{ msg.content }}
              </n-tag>
            </div>
          </template>
          <template v-else>
            <div v-if="!isSelf(msg.senderId)" class="flex items-end gap-2 max-w-[70%]">
              <n-avatar round size="small" :src="targetUser?.avatar">
                {{ targetUser?.nickname?.charAt(0) || targetUser?.phone?.slice(-4) }}
              </n-avatar>
              <div>
                <div
                  v-if="msg.type === 'text'"
                  class="px-3 py-2 rounded-lg bg-white text-gray-800 text-sm break-words shadow-sm"
                >
                  {{ msg.content }}
                </div>
                <div v-else-if="msg.type === 'image'" class="cursor-pointer" @click="previewImage(msg.content)">
                  <img
                    :src="msg.content"
                    alt="图片消息"
                    class="max-w-[200px] max-h-[200px] rounded-lg object-cover shadow-sm"
                  />
                </div>
                <div
                  v-else-if="msg.type === 'audio'"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                  @click="toggleAudioPlay(msg)"
                >
                  <n-button text size="small" class="!p-0 !min-w-0 !w-7 !h-7">
                    <template #icon>
                      <n-icon size="18">
                        <component :is="playingAudioId === msg.id ? MdPause : MdPlay" />
                      </n-icon>
                    </template>
                  </n-button>
                  <div class="flex-1">
                    <div class="h-1 bg-gray-200 rounded-full overflow-hidden min-w-[80px]">
                      <div
                        class="h-full bg-[#18a058] rounded-full transition-all"
                        :style="{ width: playingAudioId === msg.id ? audioProgress + '%' : '0%' }"
                      ></div>
                    </div>
                  </div>
                  <span class="text-xs text-gray-500 flex-none">{{ formatDuration(msg.duration) }}</span>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ formatTime(msg.createdAt) }}</p>
              </div>
            </div>
            <div v-else class="flex items-end gap-2 max-w-[70%] flex-row-reverse">
              <n-avatar round size="small" :src="userStore.user?.avatar">
                {{ userStore.user?.nickname?.charAt(0) || userStore.user?.phone?.slice(-4) }}
              </n-avatar>
              <div class="text-right">
                <div
                  v-if="msg.type === 'text'"
                  class="px-3 py-2 rounded-lg bg-[#18a058] text-white text-sm break-words shadow-sm inline-block text-left"
                >
                  {{ msg.content }}
                </div>
                <div v-else-if="msg.type === 'image'" class="cursor-pointer inline-block" @click="previewImage(msg.content)">
                  <img
                    :src="msg.content"
                    alt="图片消息"
                    class="max-w-[200px] max-h-[200px] rounded-lg object-cover shadow-sm"
                  />
                </div>
                <div
                  v-else-if="msg.type === 'audio'"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#18a058] shadow-sm cursor-pointer hover:bg-[#16a055] transition-colors inline-block"
                  @click="toggleAudioPlay(msg)"
                >
                  <div class="flex items-center gap-2">
                    <n-button text size="small" class="!p-0 !min-w-0 !w-7 !h-7">
                      <template #icon>
                        <n-icon size="18" class="!text-white">
                          <component :is="playingAudioId === msg.id ? MdPause : MdPlay" />
                        </n-icon>
                      </template>
                    </n-button>
                    <div class="flex-1">
                      <div class="h-1 bg-white/30 rounded-full overflow-hidden min-w-[80px]">
                        <div
                          class="h-full bg-white rounded-full transition-all"
                          :style="{ width: playingAudioId === msg.id ? audioProgress + '%' : '0%' }"
                        ></div>
                      </div>
                    </div>
                    <span class="text-xs text-white/80 flex-none">{{ formatDuration(msg.duration) }}</span>
                  </div>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ formatTime(msg.createdAt) }}</p>
              </div>
            </div>
          </template>
        </div>
      </div>
    </n-scrollbar>

    <div class="p-4 bg-white border-t border-gray-200 flex-none">
      <div v-if="isRecording" class="mb-3 flex items-center justify-center gap-3 py-2 bg-red-50 rounded-lg">
        <span class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
        <span class="text-sm text-red-600 font-medium">正在录音: {{ recordingDuration }}s</span>
        <n-button size="small" type="error" @click="cancelRecording">取消</n-button>
      </div>
      <div class="flex items-end gap-3">
        <n-upload
          :show-file-list="false"
          :custom-request="handleUploadImage"
          accept="image/*"
          class="flex-none"
        >
          <n-button text>
            <template #icon><n-icon size="20"><MdImage /></n-icon></template>
          </n-button>
        </n-upload>
        <n-button
          v-if="!isRecording"
          text
          @click="startRecording"
          :disabled="!isMediaRecorderSupported"
        >
          <template #icon><n-icon size="20"><MdMic /></n-icon></template>
        </n-button>
        <n-button
          v-else
          text
          type="primary"
          @click="stopRecording"
        >
          <template #icon><n-icon size="20"><MdSend /></n-icon></template>
          发送语音
        </n-button>
        <n-input
          v-model:value="inputText"
          type="textarea"
          placeholder="输入消息..."
          :autosize="{ minRows: 1, maxRows: 4 }"
          @keydown="handleKeydown"
          @input="handleTyping"
          class="flex-1"
        />
        <n-button type="primary" :disabled="!inputText.trim()" @click="handleSend" class="flex-none">
          发送
        </n-button>
      </div>
    </div>

    <n-image-preview-group>
      <n-image
        ref="previewImageRef"
        :src="previewImageSrc"
        style="display: none"
        :preview-src-list="[previewImageSrc]"
      />
    </n-image-preview-group>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, type UploadCustomRequestOptions } from 'naive-ui'
import { MdImage, MdMic, MdSend, MdPlay, MdPause } from '@vicons/ionicons4'
import dayjs from 'dayjs'
import {
  getMessages,
  sendMessage,
  markAsRead,
  uploadChatImage,
  uploadChatAudio,
  getConversations,
} from '@/api/message'
import { useUserStore } from '@/stores/user'
import { websocketService } from '@/utils/websocket'
import type { MessageItem, User } from '@/types'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

const scrollbarRef = ref<any>(null)
const messages = ref<MessageItem[]>([])
const loading = ref(false)
const inputText = ref('')
const targetUser = ref<User | null>(null)
const previewImageSrc = ref('')
const previewImageRef = ref<any>(null)

const conversationId = ref(Number(route.params.conversationId))
const lastMessageId = ref(0)

const isTyping = ref(false)
let typingTimer: any = null

const isRecording = ref(false)
const recordingDuration = ref(0)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let recordingTimer: any = null
let audioStream: MediaStream | null = null

const audioPlayers: Map<number, HTMLAudioElement> = new Map()
const playingAudioId = ref<number | null>(null)
const audioProgress = ref(0)

const isMediaRecorderSupported = typeof window !== 'undefined' && 'MediaRecorder' in window

const isTargetOnline = computed(() => {
  if (!targetUser.value) return false
  return websocketService.isUserOnline(targetUser.value.id)
})

function isSelf(senderId: number) {
  return userStore.user?.id === senderId
}

function formatTime(time: string | Date) {
  if (!time) return ''
  const now = dayjs()
  const target = dayjs(time)
  if (now.isSame(target, 'day')) {
    return target.format('HH:mm')
  }
  if (now.diff(target, 'day') < 7) {
    return target.format('ddd HH:mm')
  }
  return target.format('YYYY/MM/DD HH:mm')
}

function formatDuration(seconds?: number) {
  if (!seconds) return '0"'
  return `${seconds}"`
}

async function fetchTargetUser() {
  try {
    const res: any = await getConversations()
    const conv = (res || []).find((c: any) => c.id === conversationId.value)
    if (conv) {
      targetUser.value = conv.targetUser || null
    }
  } catch (e) {}
}

async function fetchMessages() {
  try {
    const res: any = await getMessages(conversationId.value)
    const list: MessageItem[] = res?.list || res || []
    if (list.length > 0) {
      if (lastMessageId.value === 0) {
        messages.value = list
        lastMessageId.value = list[list.length - 1]?.id || 0
      } else {
        const newMessages = list.filter((m: MessageItem) => m.id > lastMessageId.value)
        if (newMessages.length > 0) {
          messages.value = [...messages.value, ...newMessages]
          lastMessageId.value = list[list.length - 1]?.id || lastMessageId.value
          scrollToBottom()
        }
      }
    }
  } catch (e: any) {
    message.error(e.message || '获取消息失败')
  }
}

async function loadInitialMessages() {
  try {
    loading.value = true
    const res: any = await getMessages(conversationId.value)
    messages.value = res?.list || res || []
    if (messages.value.length > 0) {
      lastMessageId.value = messages.value[messages.value.length - 1]?.id || 0
    }
  } catch (e: any) {
    message.error(e.message || '获取消息失败')
  } finally {
    loading.value = false
    nextTick(() => {
      scrollToBottom()
    })
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollbarRef.value && typeof scrollbarRef.value.scrollTo === 'function') {
      scrollbarRef.value.scrollTo({ top: 999999, behavior: 'smooth' })
    } else if (scrollbarRef.value && scrollbarRef.value.$el) {
      const container = scrollbarRef.value.$el.querySelector?.('.n-scrollbar-rail')?.parentNode
      if (container && typeof container.scrollTop !== 'undefined') {
        ;(container as HTMLElement).scrollTop = (container as HTMLElement).scrollHeight
      }
    }
  })
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || !targetUser.value) return

  const tempMsg: MessageItem = {
    id: -Date.now(),
    conversationId: conversationId.value,
    senderId: userStore.user!.id,
    receiverId: targetUser.value.id,
    type: 'text',
    content: text,
    isRead: false,
    createdAt: new Date().toISOString(),
  }
  messages.value.push(tempMsg)
  scrollToBottom()
  inputText.value = ''

  const sent = websocketService.sendMessage({
    receiverId: targetUser.value.id,
    type: 'text',
    content: text,
  })

  if (!sent) {
    try {
      const res: any = await sendMessage({
        receiverId: targetUser.value.id,
        type: 'text',
        content: text,
      })
      const index = messages.value.findIndex((m) => m.id === tempMsg.id)
      if (index > -1 && res) {
        messages.value[index] = res
      }
    } catch (e: any) {
      message.error(e.message || '发送失败')
      const index = messages.value.findIndex((m) => m.id === tempMsg.id)
      if (index > -1) {
        messages.value.splice(index, 1)
      }
    }
  }
}

async function handleUploadImage({ file, onFinish, onError }: UploadCustomRequestOptions) {
  try {
    const formData = new FormData()
    formData.append('image', file.file as Blob)
    const res: any = await uploadChatImage(formData)
    if (res?.url && targetUser.value) {
      const tempMsg: MessageItem = {
        id: -Date.now(),
        conversationId: conversationId.value,
        senderId: userStore.user!.id,
        receiverId: targetUser.value.id,
        type: 'image',
        content: res.url,
        isRead: false,
        createdAt: new Date().toISOString(),
      }
      messages.value.push(tempMsg)
      scrollToBottom()

      const sent = websocketService.sendMessage({
        receiverId: targetUser.value.id,
        type: 'image',
        content: res.url,
      })

      if (!sent) {
        const result: any = await sendMessage({
          receiverId: targetUser.value.id,
          type: 'image',
          content: res.url,
        })
        const index = messages.value.findIndex((m) => m.id === tempMsg.id)
        if (index > -1 && result) {
          messages.value[index] = result
        }
      }
    }
    onFinish()
  } catch (e: any) {
    message.error(e.message || '上传失败')
    onError()
  }
}

async function startRecording() {
  if (!isMediaRecorderSupported) {
    message.error('当前浏览器不支持录音功能')
    return
  }

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioChunks = []

    const options: MediaRecorderOptions = {}
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        options.mimeType = type
        break
      }
    }

    mediaRecorder = new MediaRecorder(audioStream, options)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop())
        audioStream = null
      }
    }

    mediaRecorder.start()
    isRecording.value = true
    recordingDuration.value = 0

    recordingTimer = setInterval(() => {
      recordingDuration.value++
      if (recordingDuration.value >= 60) {
        stopRecording()
      }
    }, 1000)
  } catch (e: any) {
    message.error('无法访问麦克风：' + (e.message || '请检查权限设置'))
  }
}

async function stopRecording() {
  if (!mediaRecorder || !isRecording.value) return

  const duration = recordingDuration.value

  if (duration < 1) {
    message.warning('录音时间太短')
    cancelRecording()
    return
  }

  mediaRecorder.stop()
  isRecording.value = false

  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }

  setTimeout(async () => {
    try {
      const audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
      const ext = mediaRecorder?.mimeType?.includes('mp4') ? '.m4a' : '.webm'
      const audioFile = new File([audioBlob], `recording_${Date.now()}${ext}`, {
        type: audioBlob.type,
      })

      const formData = new FormData()
      formData.append('audio', audioFile)
      const res: any = await uploadChatAudio(formData)

      if (res?.url && targetUser.value) {
        const tempMsg: MessageItem = {
          id: -Date.now(),
          conversationId: conversationId.value,
          senderId: userStore.user!.id,
          receiverId: targetUser.value.id,
          type: 'audio',
          content: res.url,
          duration: duration,
          isRead: false,
          createdAt: new Date().toISOString(),
        }
        messages.value.push(tempMsg)
        scrollToBottom()

        const sent = websocketService.sendMessage({
          receiverId: targetUser.value.id,
          type: 'audio',
          content: res.url,
          duration: duration,
        })

        if (!sent) {
          const result: any = await sendMessage({
            receiverId: targetUser.value.id,
            type: 'audio',
            content: res.url,
            duration: duration,
          })
          const index = messages.value.findIndex((m) => m.id === tempMsg.id)
          if (index > -1 && result) {
            messages.value[index] = result
          }
        }
      }
    } catch (e: any) {
      message.error(e.message || '语音发送失败')
    } finally {
      audioChunks = []
      mediaRecorder = null
    }
  }, 100)
}

function cancelRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
  }
  isRecording.value = false
  recordingDuration.value = 0

  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }

  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop())
    audioStream = null
  }

  audioChunks = []
  mediaRecorder = null
}

function toggleAudioPlay(msg: MessageItem) {
  if (!msg.content) return

  const currentPlayer = audioPlayers.get(msg.id)

  if (playingAudioId.value === msg.id && currentPlayer && !currentPlayer.paused) {
    currentPlayer.pause()
    return
  }

  audioPlayers.forEach((player, id) => {
    if (id !== msg.id) {
      player.pause()
      player.currentTime = 0
    }
  })

  let player = currentPlayer
  if (!player) {
    player = new Audio(msg.content)
    player.addEventListener('loadedmetadata', () => {
      if (!msg.duration) {
        msg.duration = Math.ceil(player!.duration)
      }
    })
    player.addEventListener('timeupdate', () => {
      if (player && player.duration) {
        audioProgress.value = (player.currentTime / player.duration) * 100
      }
    })
    player.addEventListener('ended', () => {
      playingAudioId.value = null
      audioProgress.value = 0
    })
    audioPlayers.set(msg.id, player)
  }

  playingAudioId.value = msg.id
  audioProgress.value = 0
  player.play().catch((e) => {
    console.error('播放失败', e)
    message.error('音频播放失败')
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleTyping() {
  if (!targetUser.value) return

  websocketService.sendTyping(targetUser.value.id, true)

  if (typingTimer) {
    clearTimeout(typingTimer)
  }

  typingTimer = setTimeout(() => {
    websocketService.sendTyping(targetUser.value!.id, false)
  }, 2000)
}

function previewImage(src: string) {
  previewImageSrc.value = src
  nextTick(() => {
    if (previewImageRef.value) {
      previewImageRef.value.click()
    }
  })
}

let messageUnsubscribe: (() => void) | null = null
let conversationUnsubscribe: (() => void) | null = null
let typingUnsubscribe: (() => void) | null = null
let systemUnsubscribe: (() => void) | null = null

watch(
  () => route.params.conversationId,
  (newId) => {
    if (newId) {
      conversationId.value = Number(newId)
      messages.value = []
      lastMessageId.value = 0
      loadInitialMessages()
      fetchTargetUser()
      websocketService.markAsRead(conversationId.value)
      markAsRead(conversationId.value)
    }
  }
)

onMounted(async () => {
  await fetchTargetUser()
  await loadInitialMessages()
  websocketService.markAsRead(conversationId.value)
  markAsRead(conversationId.value)

  messageUnsubscribe = websocketService.onMessage((msg: MessageItem) => {
    if (msg.conversationId === conversationId.value) {
      const exists = messages.value.some((m) => m.id === msg.id)
      if (!exists) {
        messages.value.push(msg)
        scrollToBottom()
        websocketService.markAsRead(conversationId.value)
      }
    }
  })

  typingUnsubscribe = websocketService.onUserTyping((data: any) => {
    if (targetUser.value && data.userId === targetUser.value.id) {
      isTyping.value = data.isTyping
    }
  })

  systemUnsubscribe = websocketService.onSystemNotification((data: any) => {
    if (targetUser.value) {
      const sysMsg: MessageItem = {
        id: -Date.now() - Math.random(),
        conversationId: conversationId.value,
        senderId: 0,
        receiverId: userStore.user!.id,
        type: 'system',
        content: data.content,
        isRead: true,
        createdAt: data.timestamp,
      }
      messages.value.push(sysMsg)
      scrollToBottom()
    }
  })
})

onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer)
  if (recordingTimer) clearInterval(recordingTimer)
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
  }
  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop())
  }
  audioPlayers.forEach((player) => {
    player.pause()
  })
  audioPlayers.clear()

  if (messageUnsubscribe) messageUnsubscribe()
  if (conversationUnsubscribe) conversationUnsubscribe()
  if (typingUnsubscribe) typingUnsubscribe()
  if (systemUnsubscribe) systemUnsubscribe()
})
</script>
