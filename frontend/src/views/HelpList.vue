<template>
  <div class="help-list-page p-6">
    <n-card class="filter-card mb-6">
      <div class="flex items-center justify-between mb-4">
        <n-tabs v-model:value="activeType" type="segment" @update:value="fetchList">
          <n-tab-pane name="" label="全部" />
          <n-tab-pane name="request" label="求帮助" />
          <n-tab-pane name="offer" label="提供帮助" />
        </n-tabs>
        <n-button type="primary" @click="goPublish">
          <template #icon><n-icon><MdAdd /></n-icon></template>
          发布互助
        </n-button>
      </div>

      <div class="filter-section space-y-4">
        <div class="filter-row flex items-center gap-4 flex-wrap">
          <span class="filter-label">分类：</span>
          <div class="flex items-center gap-2 flex-wrap">
            <n-tag
              v-for="cat in HELP_CATEGORIES"
              :key="cat.value"
              :checkable="true"
              :checked="selectedCategories.includes(cat.value)"
              size="medium"
              @update:checked="(checked) => toggleCategory(cat.value, checked)"
            >
              {{ cat.label }}
            </n-tag>
          </div>
        </div>

        <div class="filter-row flex items-center gap-4 flex-wrap">
          <span class="filter-label">紧急程度：</span>
          <div class="flex items-center gap-2">
            <n-tag
              v-for="level in URGENCY_LEVELS"
              :key="level.value"
              :checkable="true"
              :type="level.value === 'urgent' ? 'error' : 'default'"
              :checked="selectedUrgency === level.value"
              size="medium"
              @update:checked="(checked) => selectUrgency(level.value, checked)"
            >
              {{ level.label }}
            </n-tag>
          </div>

          <span class="filter-label ml-6">楼栋：</span>
          <n-select
            v-model:value="selectedBuilding"
            placeholder="请选择楼栋"
            :options="buildingOptions"
            clearable
            style="width: 200px"
            @update:value="fetchList"
          />

          <n-input
            v-model:value="keyword"
            placeholder="按标题搜索"
            clearable
            style="width: 240px"
            @keyup.enter="fetchList"
          >
            <template #prefix>
              <n-icon><MdSearch /></n-icon>
            </template>
          </n-input>
          <n-button @click="fetchList">搜索</n-button>
        </div>
      </div>
    </n-card>

    <div v-if="loading" class="loading-wrap py-16">
      <n-spin size="large" />
    </div>

    <template v-else>
      <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen">
        <n-gi v-for="item in helpList" :key="item.id">
          <n-card hoverable class="help-card cursor-pointer" @click="goDetail(item.id)">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2 flex-wrap">
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
                <n-tag
                  :type="getStatusType(item.status)"
                  size="small"
                  round
                >
                  {{ HELP_STATUS[item.status] || item.status }}
                </n-tag>
              </div>
              <span class="text-gray-400 text-xs">{{ formatDate(item.createdAt) }}</span>
            </div>

            <h3 class="help-title mt-3">{{ item.title }}</h3>

            <div class="mt-2 flex items-center gap-2 flex-wrap">
              <n-tag size="small" round>
                {{ getCategoryLabel(item.category) }}
              </n-tag>
              <n-tag v-if="item.building" size="small" round type="default">
                🏢 {{ item.building.name }}
              </n-tag>
              <span v-if="item.locationDetail" class="text-gray-500 text-sm">
                📍 {{ item.locationDetail }}
              </span>
            </div>

            <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <n-avatar round size="small" :src="item.user?.avatar">
                  {{ item.user?.nickname?.charAt(0) || item.user?.phone?.slice(-4) }}
                </n-avatar>
                <span class="text-sm text-gray-600">
                  {{ item.user?.nickname || item.user?.phone }}
                </span>
              </div>
              <span class="text-gray-400 text-xs">👁 {{ item.viewCount }}</span>
            </div>
          </n-card>
        </n-gi>
      </n-grid>

      <n-empty
        v-if="helpList.length === 0"
        description="暂无互助信息，去发布第一条吧~"
        class="mt-12"
      />

      <div v-if="total > 0" class="pagination-wrap mt-6 flex justify-end">
        <n-pagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :item-count="total"
          :page-sizes="[10, 20, 30, 50]"
          show-size-picker
          show-quick-jumper
          @update:page="fetchList"
          @update:page-size="fetchList"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { MdAdd, MdSearch } from '@vicons/ionicons4'
import { getHelpList } from '@/api/help'
import { getBuildingList } from '@/api/building'
import {
  HELP_CATEGORIES,
  URGENCY_LEVELS,
  HELP_STATUS,
} from '@/types'
import type { HelpPost, Building } from '@/types'

const router = useRouter()
const message = useMessage()

const loading = ref(false)
const helpList = ref<HelpPost[]>([])
const buildingList = ref<Building[]>([])
const total = ref(0)

const activeType = ref('')
const selectedCategories = ref<string[]>([])
const selectedUrgency = ref('')
const selectedBuilding = ref<number | null>(null)
const keyword = ref('')
const page = ref(1)
const pageSize = ref(10)

const buildingOptions = computed(() =>
  buildingList.value.map((b) => ({ label: b.name, value: b.id }))
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
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

function toggleCategory(value: string, checked: boolean) {
  if (checked) {
    if (!selectedCategories.value.includes(value)) {
      selectedCategories.value.push(value)
    }
  } else {
    const idx = selectedCategories.value.indexOf(value)
    if (idx > -1) {
      selectedCategories.value.splice(idx, 1)
    }
  }
  page.value = 1
  fetchList()
}

function selectUrgency(value: string, checked: boolean) {
  selectedUrgency.value = checked ? value : ''
  page.value = 1
  fetchList()
}

async function fetchBuildings() {
  try {
    const res: any = await getBuildingList()
    buildingList.value = Array.isArray(res) ? res : res.list || res.data || []
  } catch (e: any) {
    message.error(e.message || '获取楼栋列表失败')
  }
}

async function fetchList() {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (activeType.value) params.type = activeType.value
    if (selectedCategories.value.length > 0) {
      params.category = selectedCategories.value.join(',')
    }
    if (selectedUrgency.value) params.urgency = selectedUrgency.value
    if (selectedBuilding.value) params.buildingId = selectedBuilding.value
    if (keyword.value.trim()) params.keyword = keyword.value.trim()

    const res: any = await getHelpList(params)
    if (Array.isArray(res)) {
      helpList.value = res
      total.value = res.length
    } else {
      helpList.value = res.list || res.data || []
      total.value = res.total || res.count || helpList.value.length
    }
  } catch (e: any) {
    message.error(e.message || '获取互助列表失败')
  } finally {
    loading.value = false
  }
}

function goPublish() {
  router.push('/help/publish')
}

function goDetail(id: number) {
  router.push(`/help/${id}`)
}

onMounted(() => {
  fetchBuildings()
  fetchList()
})
</script>

<style scoped>
.filter-label {
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
}
.help-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #111827;
}
.loading-wrap {
  display: flex;
  justify-content: center;
}
.cursor-pointer {
  cursor: pointer;
}
.mb-4 {
  margin-bottom: 16px;
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
.mt-6 {
  margin-top: 24px;
}
.mt-12 {
  margin-top: 48px;
}
.p-6 {
  padding: 24px;
}
.py-16 {
  padding-top: 64px;
  padding-bottom: 64px;
}
.pt-3 {
  padding-top: 12px;
}
.ml-6 {
  margin-left: 24px;
}
.space-y-4 > * + * {
  margin-top: 16px;
}
.flex {
  display: flex;
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
.justify-end {
  justify-content: flex-end;
}
.gap-2 {
  gap: 8px;
}
.gap-4 {
  gap: 16px;
}
.flex-wrap {
  flex-wrap: wrap;
}
.border-t {
  border-top-width: 1px;
}
.border-gray-100 {
  border-color: #f3f4f6;
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
.text-xs {
  font-size: 12px;
}
.text-sm {
  font-size: 14px;
}
</style>
