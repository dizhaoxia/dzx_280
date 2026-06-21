<template>
  <div class="h-full overflow-auto bg-gray-50">
    <div class="max-w-6xl mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">物品借用</h2>
          <p class="text-sm text-gray-500 mt-1">邻里互助，物品共享</p>
        </div>
        <div class="flex items-center gap-3">
          <n-input
            v-model:value="keyword"
            placeholder="搜索物品名称..."
            clearable
            style="width: 240px"
            @update:value="handleSearch"
          >
            <template #prefix>
              <n-icon><MdSearch /></n-icon>
            </template>
          </n-input>
          <n-button type="primary" @click="goPublish">
            <template #icon>
              <n-icon><MdAdd /></n-icon>
            </template>
            登记物品
          </n-button>
          <n-button @click="goManage">
            <template #icon>
              <n-icon><MdList /></n-icon>
            </template>
            借用管理
          </n-button>
        </div>
      </div>

      <div class="flex items-center gap-3 mb-6 bg-white rounded-lg p-3 shadow-sm">
        <n-tag
          v-for="tag in filterTags"
          :key="tag.value"
          :type="activeFilter === tag.value ? 'primary' : 'default'"
          :round="true"
          class="cursor-pointer"
          @click="setFilter(tag.value)"
        >
          {{ tag.label }}
        </n-tag>
        <n-space class="ml-auto" size="small">
          <n-select
            v-model:value="conditionFilter"
            placeholder="新旧程度"
            :options="conditionOptions"
            clearable
            style="width: 140px"
            @update:value="fetchItems"
          />
        </n-space>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <n-spin size="large" />
      </div>

      <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-sm">
        <n-icon size="64" class="text-gray-300 mb-4">
          <MdCube />
        </n-icon>
        <p class="text-gray-400">暂无可借用的物品</p>
        <n-button type="primary" class="mt-4" @click="goPublish">
          第一个登记物品
        </n-button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="item in items"
          :key="item.id"
          class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          @click="goDetail(item.id)"
        >
          <div class="aspect-square bg-gray-100 relative overflow-hidden">
            <img
              v-if="item.photos"
              :src="getFirstPhoto(item.photos)"
              :alt="item.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <n-icon size="48" class="text-gray-300"><MdCube /></n-icon>
            </div>
            <div class="absolute top-2 right-2">
              <n-tag
                :type="item.status === 'available' ? 'success' : item.status === 'borrowed' ? 'warning' : 'default'"
                size="small"
                round
              >
                {{ ITEM_STATUS[item.status] }}
              </n-tag>
            </div>
            <div
              v-if="item.owner && websocketService.isUserOnline(item.owner.id)"
              class="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5"
            >
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              <span class="text-xs text-gray-600">主人在线</span>
            </div>
          </div>
          <div class="p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="font-medium text-gray-800 truncate">{{ item.name }}</h3>
            </div>
            <div class="flex items-center gap-2 mb-2">
              <n-tag size="small" type="info" round>
                {{ getConditionLabel(item.condition) }}
              </n-tag>
              <n-tag v-if="item.isFreeDeposit || item.deposit === 0" size="small" type="success" round>
                免押
              </n-tag>
              <n-tag v-else size="small" round>
                押金 ¥{{ item.deposit }}
              </n-tag>
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <n-avatar round size="small" :src="item.owner?.avatar">
                {{ item.owner?.nickname?.charAt(0) }}
              </n-avatar>
              <span class="truncate">{{ item.owner?.nickname || item.owner?.phone }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="total > pageSize" class="flex justify-center mt-8">
        <n-pagination
          v-model:page="page"
          :page-size="pageSize"
          :item-count="total"
          :show-size-picker="false"
          @update:page="fetchItems"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { MdSearch, MdAdd, MdList, MdCube } from '@vicons/ionicons4'
import { h } from 'vue'
import { getItems } from '@/api/borrow'
import { ITEM_CONDITION_OPTIONS, ITEM_STATUS, type Item } from '@/types'
import { websocketService } from '@/utils/websocket'

const router = useRouter()
const message = useMessage()

const items = ref<Item[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const statusFilter = ref('')
const conditionFilter = ref<string | null>(null)
const searchTimer: any = ref(null)

const activeFilter = ref('all')
const filterTags = [
  { label: '全部', value: 'all' },
  { label: '可借用', value: 'available' },
  { label: '已借出', value: 'borrowed' },
]

const conditionOptions = ITEM_CONDITION_OPTIONS.map((opt) => ({
  label: opt.label,
  value: opt.value,
}))

function getFirstPhoto(photos: string) {
  if (!photos) return ''
  try {
    const arr = JSON.parse(photos)
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : photos
  } catch (e) {
    return photos
  }
}

function getConditionLabel(condition: string) {
  const opt = ITEM_CONDITION_OPTIONS.find((o) => o.value === condition)
  return opt?.label || condition
}

function setFilter(value: string) {
  activeFilter.value = value
  statusFilter.value = value === 'all' ? '' : value
  page.value = 1
  fetchItems()
}

function handleSearch() {
  if (searchTimer.value) clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => {
    page.value = 1
    fetchItems()
  }, 300)
}

async function fetchItems() {
  try {
    loading.value = true
    const res: any = await getItems({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: statusFilter.value || undefined,
      condition: conditionFilter.value || undefined,
    })
    items.value = res?.list || res || []
    total.value = res?.total || items.value.length
  } catch (e: any) {
    message.error(e.message || '获取物品列表失败')
  } finally {
    loading.value = false
  }
}

function goPublish() {
  router.push('/borrow/publish')
}

function goManage() {
  router.push('/borrow/manage')
}

function goDetail(id: number) {
  router.push(`/borrow/${id}`)
}

onMounted(() => {
  fetchItems()
  if (!websocketService.isConnected.value) {
    websocketService.connect()
  }
})
</script>
