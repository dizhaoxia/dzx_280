<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-800">公告</h2>
    </div>
    <div v-if="loading" class="flex justify-center py-12">
      <n-spin />
    </div>
    <div v-else-if="announcements.length === 0" class="text-center py-12 text-gray-400">
      暂无公告
    </div>
    <div v-else class="flex flex-col gap-3">
      <div
        v-for="item in sortedAnnouncements"
        :key="item.id"
        class="p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
        @click="handleClick(item.id)"
      >
        <div class="flex items-start gap-3">
          <div class="flex items-center gap-2 flex-none">
            <n-tag v-if="item.type === 'notice'" size="small" type="info" round>
              通知
            </n-tag>
            <n-tag v-else-if="item.type === 'emergency'" size="small" type="error" round>
              紧急
            </n-tag>
            <n-tag v-else-if="item.type === 'activity'" size="small" type="success" round>
              活动
            </n-tag>
            <n-tag v-if="item.isTop" size="small" type="warning" round>
              置顶
            </n-tag>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-medium text-gray-800 truncate">
                {{ item.title }}
              </h3>
              <span class="text-xs text-gray-400 flex-none">
                {{ formatTime(item.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import { getAnnouncementList } from '@/api/announcement'
import type { Announcement } from '@/types'

const router = useRouter()
const message = useMessage()

const announcements = ref<Announcement[]>([])
const loading = ref(false)

const sortedAnnouncements = computed(() => {
  return [...announcements.value].sort((a, b) => {
    if (a.isTop && !b.isTop) return -1
    if (!a.isTop && b.isTop) return 1
    return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  })
})

async function fetchAnnouncements() {
  try {
    loading.value = true
    const res: any = await getAnnouncementList()
    announcements.value = res || []
  } catch (e: any) {
    message.error(e.message || '获取公告列表失败')
  } finally {
    loading.value = false
  }
}

function formatTime(time: string) {
  const now = dayjs()
  const target = dayjs(time)
  if (now.isSame(target, 'day')) {
    return target.format('HH:mm')
  }
  if (now.isSame(target, 'year')) {
    return target.format('MM/DD')
  }
  return target.format('YYYY/MM/DD')
}

function handleClick(id: number) {
  router.push(`/announcements/${id}`)
}

onMounted(() => {
  fetchAnnouncements()
})
</script>
