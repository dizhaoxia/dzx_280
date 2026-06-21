<template>
  <div class="h-full flex overflow-hidden">
    <div class="flex-none w-[280px] border-r border-gray-200 bg-white flex flex-col h-full">
      <div class="h-14 px-4 flex items-center border-b border-gray-100 flex-none">
        <span class="text-base font-semibold text-gray-800">消息</span>
        <span v-if="websocketService.isConnected.value" class="ml-auto flex items-center gap-1 text-xs text-green-500">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          已连接
        </span>
        <span v-else class="ml-auto flex items-center gap-1 text-xs text-gray-400">
          <span class="w-2 h-2 rounded-full bg-gray-400"></span>
          离线
        </span>
      </div>
      <n-scrollbar class="flex-1 min-h-0">
        <div v-if="loading" class="p-4 flex justify-center">
          <n-spin size="small" />
        </div>
        <div v-else-if="conversations.length === 0" class="p-8 text-center text-gray-400 text-sm">
          暂无会话
        </div>
        <div v-else>
          <div
            v-for="conv in conversations"
            :key="conv.id"
            class="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50"
            :class="{ 'bg-gray-50': currentConversationId === conv.id }"
            @click="handleClickConversation(conv.id)"
          >
            <div class="relative flex-none">
              <n-badge :value="getUnreadCount(conv)" :max="99" :show="getUnreadCount(conv) > 0">
                <n-avatar round size="medium" :src="conv.targetUser?.avatar">
                  {{ conv.targetUser?.nickname?.charAt(0) || conv.targetUser?.phone?.slice(-4) }}
                </n-avatar>
              </n-badge>
              <span
                v-if="isTargetOnline(conv.targetUser?.id)"
                class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"
              ></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="font-medium text-sm text-gray-800 truncate">
                  {{ conv.targetUser?.nickname || conv.targetUser?.phone }}
                  <span
                    v-if="isTargetOnline(conv.targetUser?.id)"
                    class="ml-1 text-xs text-green-500 font-normal"
                  >[在线]</span>
                </span>
                <span class="text-xs text-gray-400 flex-none ml-2">
                  {{ formatTime(conv.lastMessageTime) }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1 truncate">
                {{ formatLastMessage(conv) }}
              </p>
            </div>
          </div>
        </div>
      </n-scrollbar>
    </div>
    <div class="flex-1 min-w-0 h-full overflow-hidden">
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition name="fade" mode="out-in">
          <component v-if="Component" :is="Component" :key="currentRoute.fullPath" />
          <div v-else class="h-full flex items-center justify-center bg-gray-50">
            <div class="text-center">
              <n-icon size="48" class="text-gray-300 mb-3">
                <MdChatbubbles />
              </n-icon>
              <p class="text-gray-400 text-sm">请选择一个会话开始聊天</p>
            </div>
          </div>
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { MdChatbubbles } from '@vicons/ionicons4'
import dayjs from 'dayjs'
import { getConversations } from '@/api/message'
import { useUserStore } from '@/stores/user'
import { websocketService } from '@/utils/websocket'
import type { Conversation } from '@/types'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

const conversations = ref<Conversation[]>([])
const loading = ref(false)

const currentConversationId = computed(() => {
  if (route.name === 'Chat') {
    return Number(route.params.conversationId)
  }
  return null
})

function getUnreadCount(conv: Conversation) {
  if (!conv.unreadCounts || !userStore.user) return 0
  return conv.unreadCounts[String(userStore.user.id)] || 0
}

function isTargetOnline(userId?: number) {
  if (!userId) return false
  return websocketService.isUserOnline(userId)
}

function formatTime(time?: string) {
  if (!time) return ''
  const now = dayjs()
  const target = dayjs(time)
  if (now.isSame(target, 'day')) {
    return target.format('HH:mm')
  }
  if (now.diff(target, 'day') < 7) {
    return target.format('ddd')
  }
  return target.format('MM/DD')
}

function formatLastMessage(conv: Conversation) {
  if (!conv.lastMessage) return '暂无消息'
  if (conv.lastMessage.startsWith('/uploads/')) {
    if (conv.lastMessage.includes('/audio/')) {
      return '[语音消息]'
    }
    return '[图片消息]'
  }
  return conv.lastMessage
}

async function fetchConversations() {
  try {
    loading.value = true
    const res: any = await getConversations()
    conversations.value = res || []
  } catch (e: any) {
    message.error(e.message || '获取会话列表失败')
  } finally {
    loading.value = false
  }
}

function handleClickConversation(id: number) {
  router.push(`/messages/${id}`)
}

let conversationUnsubscribe: (() => void) | null = null

watch(
  () => route.params.conversationId,
  (newId) => {
    if (newId) fetchConversations()
  }
)

onMounted(() => {
  fetchConversations()
  websocketService.connect()

  conversationUnsubscribe = websocketService.onConversationUpdate((data: any) => {
    conversations.value = data || []
  })
})

onUnmounted(() => {
  if (conversationUnsubscribe) {
    conversationUnsubscribe()
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
