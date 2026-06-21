<template>
  <div class="home-page p-6">
    <n-carousel
      class="banner-carousel mb-6"
      :show-dots="true"
      :interval="4000"
      autoplay
    >
      <div
        v-for="(banner, index) in banners"
        :key="index"
        class="banner-item"
        :style="{ background: banner.color }"
      >
        <div class="banner-content">
          <h2 class="banner-title">{{ banner.title }}</h2>
          <p class="banner-desc">{{ banner.desc }}</p>
        </div>
      </div>
    </n-carousel>

    <n-grid :cols="12" :x-gap="16" :y-gap="16" responsive="screen">
      <n-gi :span="8">
        <n-card title="📢 最新公告" class="announcement-card" hoverable>
          <template #header-extra>
            <n-button text type="primary" size="small" @click="goAnnouncements">
              查看全部
            </n-button>
          </template>
          <div v-if="loadingAnnouncements" class="loading-wrap">
            <n-spin size="small" />
          </div>
          <n-list v-else hoverable clickable bordered="false">
            <n-list-item
              v-for="item in topAnnouncements"
              :key="item.id"
              @click="goAnnouncementDetail(item.id)"
            >
              <template #prefix>
                <n-tag v-if="item.isTop" type="warning" size="small" round>
                  置顶
                </n-tag>
                <n-tag
                  v-else-if="item.type === 'emergency'"
                  type="error"
                  size="small"
                  round
                >
                  紧急
                </n-tag>
                <n-tag v-else-if="item.type === 'activity'" type="success" size="small" round>
                  活动
                </n-tag>
                <n-tag v-else size="small" round>通知</n-tag>
              </template>
              <span class="truncate flex-1">{{ item.title }}</span>
              <template #suffix>
                <span class="text-gray-400 text-xs">{{ formatDate(item.createdAt) }}</span>
              </template>
            </n-list-item>
            <n-empty v-if="topAnnouncements.length === 0" description="暂无公告" />
          </n-list>
        </n-card>
      </n-gi>

      <n-gi :span="4">
        <n-card title="⚡ 快捷入口" class="quick-card" hoverable>
          <n-grid :cols="2" :x-gap="12" :y-gap="12">
            <n-gi>
              <div class="quick-item bg-blue-50" @click="goPublishHelp('request')">
                <div class="quick-icon text-blue-500">
                  <n-icon size="28"><MdHelpCircle /></n-icon>
                </div>
                <span class="quick-label">发布求助</span>
              </div>
            </n-gi>
            <n-gi>
              <div class="quick-item bg-green-50" @click="goPublishHelp('offer')">
                <div class="quick-icon text-green-500">
                  <n-icon size="28"><MdHand /></n-icon>
                </div>
                <span class="quick-label">发布帮助</span>
              </div>
            </n-gi>
            <n-gi>
              <div class="quick-item bg-orange-50" @click="goMessages">
                <div class="quick-icon text-orange-500">
                  <n-badge :value="userStore.user?.unreadCount || 0" :max="99" :show="(userStore.user?.unreadCount || 0) > 0">
                    <n-icon size="28"><MdChatbubbles /></n-icon>
                  </n-badge>
                </div>
                <span class="quick-label">消息中心</span>
              </div>
            </n-gi>
            <n-gi>
              <div class="quick-item bg-purple-50" @click="goMyHelp">
                <div class="quick-icon text-purple-500">
                  <n-icon size="28"><MdListBox /></n-icon>
                </div>
                <span class="quick-label">我的互助</span>
              </div>
            </n-gi>
          </n-grid>
        </n-card>
      </n-gi>

      <n-gi :span="12">
        <n-card title="🔥 最新互助" class="help-card" hoverable>
          <template #header-extra>
            <n-button text type="primary" size="small" @click="goHelpList">
              查看全部
            </n-button>
          </template>
          <div v-if="loadingHelp" class="loading-wrap">
            <n-spin size="small" />
          </div>
          <n-grid
            v-else
            :cols="4"
            :x-gap="16"
            :y-gap="16"
            responsive="screen"
          >
            <n-gi v-for="item in latestHelpList" :key="item.id">
              <n-card
                hoverable
                size="small"
                class="help-item-card cursor-pointer"
                @click="goHelpDetail(item.id)"
              >
                <div class="mb-2 flex items-center gap-2 flex-wrap">
                  <n-tag
                    :type="item.type === 'request' ? 'info' : 'success'"
                    size="small"
                    round
                  >
                    {{ item.type === 'request' ? '求帮助' : '提供帮助' }}
                  </n-tag>
                  <n-tag
                    v-if="item.urgency === 'urgent'"
                    type="error"
                    size="small"
                    round
                  >
                    紧急
                  </n-tag>
                </div>
                <h3 class="help-title">{{ item.title }}</h3>
                <div class="mt-2 flex items-center gap-2 flex-wrap">
                  <n-tag size="small" round>
                    {{ getCategoryLabel(item.category) }}
                  </n-tag>
                  <n-tag size="small" round type="default">
                    {{ item.building?.name || '未填写楼栋' }}
                  </n-tag>
                </div>
                <div class="mt-3 text-gray-400 text-xs flex justify-between">
                  <span>{{ formatDate(item.createdAt) }}</span>
                  <span>👁 {{ item.viewCount }}</span>
                </div>
              </n-card>
            </n-gi>
          </n-grid>
          <n-empty
            v-if="!loadingHelp && latestHelpList.length === 0"
            description="暂无互助信息"
            class="mt-4"
          />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  MdHelpCircle,
  MdHand,
  MdChatbubbles,
  MdListBox,
} from '@vicons/ionicons4'
import { getAnnouncementList } from '@/api/announcement'
import { getHelpList } from '@/api/help'
import { useUserStore } from '@/stores/user'
import { HELP_CATEGORIES } from '@/types'
import type { Announcement, HelpPost } from '@/types'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const loadingAnnouncements = ref(false)
const loadingHelp = ref(false)
const topAnnouncements = ref<Announcement[]>([])
const latestHelpList = ref<HelpPost[]>([])

const banners = [
  {
    title: '邻里互助 温暖社区',
    desc: '远亲不如近邻，互帮互助共建美好家园',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    title: '发布求助 快速响应',
    desc: '遇到困难别担心，邻居们来帮你',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    title: '伸出援手 传递爱心',
    desc: '力所能及帮助他人，收获积分与感谢',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
]

function getCategoryLabel(value: string) {
  const item = HELP_CATEGORIES.find((c) => c.value === value)
  return item?.label || value
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

async function fetchAnnouncements() {
  loadingAnnouncements.value = true
  try {
    const res: any = await getAnnouncementList()
    const list: Announcement[] = Array.isArray(res) ? res : res.list || res.data || []
    topAnnouncements.value = list.filter((a) => a.isTop).slice(0, 3)
    if (topAnnouncements.value.length < 3) {
      const others = list.filter((a) => !a.isTop).slice(0, 3 - topAnnouncements.value.length)
      topAnnouncements.value = [...topAnnouncements.value, ...others]
    }
  } catch (e: any) {
    message.error(e.message || '获取公告失败')
  } finally {
    loadingAnnouncements.value = false
  }
}

async function fetchLatestHelp() {
  loadingHelp.value = true
  try {
    const res: any = await getHelpList({ page: 1, pageSize: 8 })
    latestHelpList.value = Array.isArray(res) ? res : res.list || res.data || []
  } catch (e: any) {
    message.error(e.message || '获取互助列表失败')
  } finally {
    loadingHelp.value = false
  }
}

function goAnnouncements() {
  router.push('/announcements')
}

function goAnnouncementDetail(id: number) {
  router.push(`/announcements/${id}`)
}

function goHelpList() {
  router.push('/help')
}

function goHelpDetail(id: number) {
  router.push(`/help/${id}`)
}

function goPublishHelp(type: string) {
  router.push({ path: '/help/publish', query: { type } })
}

function goMessages() {
  router.push('/messages')
}

function goMyHelp() {
  router.push('/profile')
}

onMounted(() => {
  fetchAnnouncements()
  fetchLatestHelp()
})
</script>

<style scoped>
.banner-carousel {
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
}
.banner-item {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.banner-content {
  text-align: center;
}
.banner-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 12px 0;
}
.banner-desc {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}
.announcement-card :deep(.n-list-item) {
  display: flex;
  align-items: center;
  gap: 12px;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.flex-1 {
  flex: 1;
}
.text-gray-400 {
  color: #9ca3af;
}
.text-xs {
  font-size: 12px;
}
.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.quick-item:hover {
  transform: translateY(-2px);
}
.quick-icon {
  margin-bottom: 8px;
}
.quick-label {
  font-size: 13px;
  color: #374151;
}
.help-item-card {
  transition: all 0.2s ease;
}
.help-item-card:hover {
  transform: translateY(-2px);
}
.help-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #111827;
}
.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 24px;
}
.cursor-pointer {
  cursor: pointer;
}
.mb-2 {
  margin-bottom: 8px;
}
.mb-6 {
  margin-bottom: 24px;
}
.mt-2 {
  margin-top: 8px;
}
.mt-3 {
  margin-top: 12px;
}
.mt-4 {
  margin-top: 16px;
}
.p-6 {
  padding: 24px;
}
.bg-blue-50 {
  background-color: #eff6ff;
}
.bg-green-50 {
  background-color: #ecfdf5;
}
.bg-orange-50 {
  background-color: #fff7ed;
}
.bg-purple-50 {
  background-color: #faf5ff;
}
.text-blue-500 {
  color: #3b82f6;
}
.text-green-500 {
  color: #10b981;
}
.text-orange-500 {
  color: #f97316;
}
.text-purple-500 {
  color: #8b5cf6;
}
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.justify-between {
  justify-content: space-between;
}
.gap-2 {
  gap: 8px;
}
.gap-12 {
  gap: 48px;
}
.flex-wrap {
  flex-wrap: wrap;
}
</style>
