<template>
  <div class="h-full flex flex-col bg-gray-50">
    <div class="h-14 px-4 flex items-center bg-white border-b border-gray-200 flex-none">
      <n-button text @click="goBack" class="mr-3">
        <template #icon><n-icon><MdArrowBack /></n-icon></template>
      </n-button>
      <n-avatar round size="medium" :src="targetUser?.avatar">
        {{ targetUser?.nickname?.charAt(0) || targetUser?.phone?.slice(-4) }}
      </n-avatar>
      <div class="ml-3">
        <div class="flex items-center gap-2">
          <span class="font-medium text-gray-800">
            {{ targetUser?.nickname || targetUser?.phone }}
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
      </div>
    </div>

    <n-scrollbar ref="scrollbarRef" class="flex-1 p-4">
      <div v-if="loading" class="h-full flex items-center justify-center">
        <n-spin />
      </div>
      <div v-else class="flex flex-col gap-4">
        <div
          v-for="(msg, index) in messages"
          :key="msg.id"
          class="flex"
          :class="isSelf(msg.senderId) ? 'justify-end' : 'justify-start'"
        >
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
              <p class="text-xs text-gray-400 mt-1">{{ formatTime(msg.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </n-scrollbar>

    <div class="p-4 bg-white border-t border-gray-200 flex-none">
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
        <n-input
          v-model:value="inputText"
          type="textarea"
          placeholder="输入消息..."
          :autosize="{ minRows: 1, maxRows: 4 }"
          @keydown="handleKeydown"
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, type UploadCustomRequestOptions } from 'naive-ui'
import { MdArrowBack, MdImage } from '@vicons/ionicons4'
import dayjs from 'dayjs'
import { getMessages, sendMessage, markAsRead, uploadChatImage } from '@/api/message'
import { getConversations } from '@/api/message'
import { useUserStore } from '@/stores/user'
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
let pollTimer: any = null
let lastMessageId = 0

function isSelf(senderId: number) {
  return userStore.user?.id === senderId
}

function formatTime(time: string) {
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
      if (lastMessageId === 0) {
        messages.value = list
        lastMessageId = list[list.length - 1]?.id || 0
      } else {
        const newMessages = list.filter((m: MessageItem) => m.id > lastMessageId)
        if (newMessages.length > 0) {
          messages.value = [...messages.value, ...newMessages]
          lastMessageId = list[list.length - 1]?.id || lastMessageId
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
      lastMessageId = messages.value[messages.value.length - 1]?.id || 0
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
    if (scrollbarRef.value) {
      const container = scrollbarRef.value.$el?.querySelector('.n-scrollbar-rail')?.parentNode
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  })
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || !targetUser.value) return
  try {
    await sendMessage({
      receiverId: targetUser.value.id,
      type: 'text',
      content: text,
    })
    inputText.value = ''
    fetchMessages()
  } catch (e: any) {
    message.error(e.message || '发送失败')
  }
}

async function handleUploadImage({ file, onFinish, onError }: UploadCustomRequestOptions) {
  try {
    const formData = new FormData()
    formData.append('image', file.file as Blob)
    const res: any = await uploadChatImage(formData)
    if (res?.url && targetUser.value) {
      await sendMessage({
        receiverId: targetUser.value.id,
        type: 'image',
        content: res.url,
      })
      fetchMessages()
    }
    onFinish()
  } catch (e: any) {
    message.error(e.message || '上传失败')
    onError()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function previewImage(src: string) {
  previewImageSrc.value = src
  nextTick(() => {
    if (previewImageRef.value) {
      previewImageRef.value.click()
    }
  })
}

function goBack() {
  router.push('/messages')
}

watch(
  () => route.params.conversationId,
  (newId) => {
    if (newId) {
      conversationId.value = Number(newId)
      messages.value = []
      lastMessageId = 0
      loadInitialMessages()
      fetchTargetUser()
      markAsRead(conversationId.value)
    }
  }
)

onMounted(async () => {
  await fetchTargetUser()
  await loadInitialMessages()
  markAsRead(conversationId.value)
  pollTimer = setInterval(fetchMessages, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
