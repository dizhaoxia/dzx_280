<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-6">
      <n-button text @click="goBack">
        <template #icon><n-icon><MdArrowBack /></n-icon></template>
        返回公告列表
      </n-button>
    </div>
    <div v-if="loading" class="flex justify-center py-12">
      <n-spin />
    </div>
    <div v-else-if="announcement" class="bg-white rounded-lg border border-gray-100 p-6">
      <div class="flex items-center gap-2 mb-4">
        <n-tag v-if="announcement.type === 'notice'" size="small" type="info" round>
          通知
        </n-tag>
        <n-tag v-else-if="announcement.type === 'emergency'" size="small" type="error" round>
          紧急
        </n-tag>
        <n-tag v-else-if="announcement.type === 'activity'" size="small" type="success" round>
          活动
        </n-tag>
        <n-tag v-if="announcement.isTop" size="small" type="warning" round>
          置顶
        </n-tag>
      </div>
      <h1 class="text-2xl font-semibold text-gray-800 mb-4">
        {{ announcement.title }}
      </h1>
      <div class="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
        <span>发布者：{{ announcement.publisher?.nickname || announcement.publisher?.phone || '未知' }}</span>
        <span>发布时间：{{ formatTime(announcement.createdAt) }}</span>
      </div>
      <div class="prose prose-gray max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
        {{ announcement.content }}
      </div>
    </div>
    <div v-else class="text-center py-12 text-gray-400">
      公告不存在
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { MdArrowBack } from '@vicons/ionicons4'
import dayjs from 'dayjs'
import { getAnnouncementDetail } from '@/api/announcement'
import type { Announcement } from '@/types'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const announcement = ref<Announcement | null>(null)
const loading = ref(false)

async function fetchDetail() {
  try {
    loading.value = true
    const id = Number(route.params.id)
    const res: any = await getAnnouncementDetail(id)
    announcement.value = res || null
  } catch (e: any) {
    message.error(e.message || '获取公告详情失败')
  } finally {
    loading.value = false
  }
}

function formatTime(time: string) {
  return dayjs(time).format('YYYY/MM/DD HH:mm')
}

function goBack() {
  router.push('/announcements')
}

onMounted(() => {
  fetchDetail()
})
</script>
