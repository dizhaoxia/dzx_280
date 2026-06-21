<template>
  <n-layout has-sider style="min-height: 100vh">
    <n-layout-sider
      :width="220"
      :collapsed-width="64"
      show-trigger
      collapse-mode="width"
      v-model:collapsed="collapsed"
      bordered
    >
      <div class="logo" :class="{ collapsed }">
        <span v-if="!collapsed">邻里互助</span>
        <span v-else>邻里</span>
      </div>
      <n-menu
        :options="menuOptions"
        :value="activeMenu"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        @update:value="handleMenuClick"
      />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered style="height: 64px">
        <div class="header-content">
          <div class="header-left">
            <h2 class="page-title">{{ currentTitle }}</h2>
          </div>
          <div class="header-right">
            <n-badge :value="unreadCount" :max="99" :show="unreadCount > 0">
              <n-button text @click="goMessages">
                <template #icon><n-icon><MdChatbubbles /></n-icon></template>
                消息
              </n-button>
            </n-badge>
            <n-dropdown :options="userMenuOptions" @select="handleUserSelect">
              <n-button text>
                <n-avatar round size="small" :src="userStore.user?.avatar">
                  {{ userStore.user?.nickname?.charAt(0) || userStore.user?.phone?.slice(-4) }}
                </n-avatar>
                <span class="ml-2">{{ userStore.user?.nickname || userStore.user?.phone }}</span>
              </n-button>
            </n-dropdown>
          </div>
        </div>
      </n-layout-header>
      <n-layout-content content-style="padding: 0">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  MdHome,
  MdChatbubbles,

  MdPerson,

} from '@vicons/ionicons4'
import { useUserStore } from '@/stores/user'
import { getUnreadCount } from '@/api/message'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

const collapsed = ref(false)
const unreadCount = ref(0)

const menuOptions = [
  {
    label: '首页',
    key: '/',
    icon: () => h(MdHome),
  },
  {
    label: '互助大厅',
    key: '/help',
    icon: () => h(MdPerson),
  },
  {
    label: '消息',
    key: '/messages',
    icon: () => h(MdChatbubbles),
  },
  {
    label: '公告',
    key: '/announcements',
    icon: () => h(MdChatbubbles),
  },
  {
    label: '个人中心',
    key: '/profile',
    icon: () => h(MdPerson),
  },
]

const userMenuOptions = [
  {
    label: '个人中心',
    key: 'profile',
    icon: () => h(MdPerson),
  },
  {
    label: '实名认证',
    key: 'verify',
    icon: () => h(MdPerson),
  },
  {
    type: 'divider' as const,
    key: 'divider',
     icon: () => h(MdPerson),
  },
  {
    label: '退出登录',
    key: 'logout',
 icon: () => h(MdPerson),
  },
]

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/help')) return '/help'
  if (path.startsWith('/messages')) return '/messages'
  if (path.startsWith('/announcements')) return '/announcements'
  if (path.startsWith('/profile') || path.startsWith('/verify')) return '/profile'
  return '/'
})

const currentTitle = computed(() => {
  return (route.meta.title as string) || '首页'
})

function handleMenuClick(key: string) {
  router.push(key)
}

function handleUserSelect(key: string) {
  if (key === 'profile') {
    router.push('/profile')
  } else if (key === 'verify') {
    router.push('/verify')
  } else if (key === 'logout') {
    userStore.logout()
    message.success('已退出登录')
    router.push('/login')
  }
}

function goMessages() {
  router.push('/messages')
}

import { h } from 'vue'

let pollTimer: any = null

async function fetchUnread() {
  try {
    const res: any = await getUnreadCount()
    unreadCount.value = res.count || 0
    userStore.updateUnreadCount(res.count || 0)
  } catch (e) {}
}

onMounted(() => {
  fetchUnread()
  pollTimer = setInterval(fetchUnread, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #18a058;
  border-bottom: 1px solid #f0f0f0;
}
.logo.collapsed {
  font-size: 14px;
}
.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.header-left .page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.ml-2 {
  margin-left: 8px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
