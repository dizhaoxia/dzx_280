<template>
  <div class="help-detail-page p-6 max-w-4xl mx-auto">
    <div v-if="loading" class="loading-wrap py-16">
      <n-spin size="large" />
    </div>

    <template v-else-if="detail">
      <n-card hoverable>
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-2 flex-wrap">
            <n-tag
              :type="detail.type === 'request' ? 'info' : 'success'"
              size="medium"
              round
            >
              {{ detail.type === 'request' ? '求帮助' : '提供帮助' }}
            </n-tag>
            <n-tag
              v-if="detail.urgency === 'urgent'"
              type="error"
              size="medium"
              round
            >
              紧急
            </n-tag>
            <n-tag
              :type="getStatusType(detail.status)"
              size="medium"
              round
            >
              {{ HELP_STATUS[detail.status] || detail.status }}
            </n-tag>
            <n-tag size="medium" round>
              {{ getCategoryLabel(detail.category) }}
            </n-tag>
          </div>
          <n-button text @click="goBack">
            <template #icon><n-icon><MdArrowBack /></n-icon></template>
            返回
          </n-button>
        </div>

        <h1 class="detail-title">{{ detail.title }}</h1>

        <div class="meta-row mt-4 pb-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <n-avatar round size="large" :src="detail.user?.avatar">
              {{ detail.user?.nickname?.charAt(0) || detail.user?.phone?.slice(-4) }}
            </n-avatar>
            <div>
              <div class="font-medium text-gray-800">
                {{ detail.user?.nickname || detail.user?.phone }}
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ formatDate(detail.createdAt) }} · 👁 {{ detail.viewCount }} 浏览
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <template v-if="isOwner">
              <n-dropdown
                :options="statusOptions"
                @select="handleChangeStatus"
                trigger="click"
              >
                <n-button size="small" type="warning">
                  <template #icon><n-icon><MdRefresh /></n-icon></template>
                  修改状态
                </n-button>
              </n-dropdown>
              <n-button size="small" type="primary" @click="handleEdit">
                <template #icon><n-icon><MdCreate /></n-icon></template>
                编辑
              </n-button>
              <n-popconfirm
                positive-text="确定删除"
                negative-text="取消"
                @positive-click="handleDelete"
              >
                <template #trigger>
                  <n-button size="small" type="error">
                    <template #icon><n-icon><MdTrash /></n-icon></template>
                    删除
                  </n-button>
                </template>
                确定删除这条互助信息吗？
              </n-popconfirm>
            </template>
            <template v-else>
              <n-button type="primary" @click="handleContact">
                <template #icon><n-icon><MdChatbubbles /></n-icon></template>
                联系TA
              </n-button>
            </template>
          </div>
        </div>

        <div class="content-section mt-6">
          <div class="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {{ detail.content }}
          </div>
        </div>

        <div v-if="imageList.length > 0" class="image-section mt-6">
          <n-grid :cols="3" :x-gap="12" :y-gap="12">
            <n-gi v-for="(img, index) in imageList" :key="index">
              <n-image
                :src="img"
                object-fit="cover"
                width="100%"
                height="200px"
                class="rounded-lg"
              />
            </n-gi>
          </n-grid>
        </div>

        <div class="location-section mt-6 p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2 text-gray-600 flex-wrap">
            <span v-if="detail.building">
              🏢 {{ detail.building.name }}
            </span>
            <span v-if="detail.building && detail.locationDetail">·</span>
            <span v-if="detail.locationDetail">
              📍 {{ detail.locationDetail }}
            </span>
          </div>
        </div>
      </n-card>

      <n-card title="💬 评论区" class="mt-6" hoverable>
        <n-list bordered="false">
          <n-list-item v-for="(comment, idx) in mockComments" :key="idx">
            <template #prefix>
              <n-avatar round size="small" :src="comment.avatar">
                {{ comment.name?.charAt(0) }}
              </n-avatar>
            </template>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-sm text-gray-800">{{ comment.name }}</span>
                <span class="text-xs text-gray-400">{{ comment.time }}</span>
              </div>
              <div class="text-sm text-gray-600 mt-1">{{ comment.content }}</div>
            </div>
          </n-list-item>
          <n-empty v-if="mockComments.length === 0" description="暂无评论，快来抢沙发~" />
        </n-list>
        <div class="comment-input mt-4 flex gap-2">
          <n-input
            v-model:value="commentText"
            placeholder="写下你的评论..."
            size="large"
          />
          <n-button type="primary" size="large" @click="submitComment">发布</n-button>
        </div>
      </n-card>
    </template>

    <n-empty v-else description="未找到该互助信息" class="mt-16" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import {
  MdArrowBack,
  MdCreate,
  MdTrash,
  MdChatbubbles,
  MdRefresh,
} from '@vicons/ionicons4'
import { getHelpDetail, deleteHelp, updateHelpStatus } from '@/api/help'
import { useUserStore } from '@/stores/user'
import { HELP_CATEGORIES, HELP_STATUS } from '@/types'
import type { HelpPost } from '@/types'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()

const loading = ref(false)
const detail = ref<HelpPost | null>(null)
const commentText = ref('')

const mockComments = ref([
  { name: '张阿姨', avatar: '', time: '2小时前', content: '我可以帮忙，已私信你了~' },
  { name: '小李', avatar: '', time: '1小时前', content: '同在这个楼栋，需要的话联系我' },
])

const isOwner = computed(() => {
  return detail.value && userStore.user && detail.value.userId === userStore.user.id
})

const imageList = computed(() => {
  if (!detail.value?.images) return []
  try {
    const parsed = JSON.parse(detail.value.images)
    if (Array.isArray(parsed)) return parsed
  } catch (e) {}
  if (typeof detail.value.images === 'string') {
    return detail.value.images.split(',').filter(Boolean)
  }
  return []
})

const statusOptions = computed(() =>
  Object.entries(HELP_STATUS)
    .filter(([key]) => key !== detail.value?.status)
    .map(([key, label]) => ({ label, key }))
)

function getCategoryLabel(value: string) {
  const item = HELP_CATEGORIES.find((c) => c.value === value)
  return item?.label || value
}

function getStatusType(status: string) {
  if (status === 'open' || status === 'in_progress') return 'warning'
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'default'
  return 'default'
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

async function fetchDetail() {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const res: any = await getHelpDetail(id)
    detail.value = res
  } catch (e: any) {
    message.error(e.message || '获取详情失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function handleEdit() {
  message.info('编辑功能待开发')
}

async function handleDelete() {
  if (!detail.value) return
  try {
    await deleteHelp(detail.value.id)
    message.success('删除成功')
    router.push('/help')
  } catch (e: any) {
    message.error(e.message || '删除失败')
  }
}

async function handleChangeStatus(status: string) {
  if (!detail.value) return
  try {
    await updateHelpStatus(detail.value.id, status)
    message.success('状态修改成功')
    detail.value.status = status
  } catch (e: any) {
    message.error(e.message || '修改状态失败')
  }
}

function handleContact() {
  if (!detail.value?.userId) return
  message.info('正在跳转消息中心...')
  router.push({
    path: '/messages',
    query: { userId: String(detail.value.userId) },
  })
}

function submitComment() {
  if (!commentText.value.trim()) {
    message.warning('请输入评论内容')
    return
  }
  mockComments.value.push({
    name: userStore.user?.nickname || '我',
    avatar: userStore.user?.avatar || '',
    time: '刚刚',
    content: commentText.value,
  })
  commentText.value = ''
  message.success('评论成功')
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.detail-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #111827;
  line-height: 1.4;
}
.loading-wrap {
  display: flex;
  justify-content: center;
}
.p-6 {
  padding: 24px;
}
.p-4 {
  padding: 16px;
}
.mt-1 {
  margin-top: 4px;
}
.mt-4 {
  margin-top: 16px;
}
.mt-6 {
  margin-top: 24px;
}
.mt-16 {
  margin-top: 64px;
}
.mb-4 {
  margin-bottom: 16px;
}
.pb-4 {
  padding-bottom: 16px;
}
.py-16 {
  padding-top: 64px;
  padding-bottom: 64px;
}
.max-w-4xl {
  max-width: 56rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.flex {
  display: flex;
}
.flex-1 {
  flex: 1;
}
.items-center {
  align-items: center;
}
.items-start {
  align-items: flex-start;
}
.justify-between {
  justify-content: space-between;
}
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
.flex-wrap {
  flex-wrap: wrap;
}
.border-b {
  border-bottom-width: 1px;
}
.border-gray-100 {
  border-color: #f3f4f6;
}
.bg-gray-50 {
  background-color: #f9fafb;
}
.rounded-lg {
  border-radius: 8px;
}
.font-medium {
  font-weight: 500;
}
.text-sm {
  font-size: 14px;
}
.text-xs {
  font-size: 12px;
}
.text-gray-400 {
  color: #9ca3af;
}
.text-gray-500 {
  color: #6b7280;
}
.text-gray-600 {
  color: #4b5563;
}
.text-gray-700 {
  color: #374151;
}
.text-gray-800 {
  color: #1f2937;
}
.leading-relaxed {
  line-height: 1.625;
}
.whitespace-pre-wrap {
  white-space: pre-wrap;
}
.rounded-lg {
  border-radius: 8px;
}
</style>
