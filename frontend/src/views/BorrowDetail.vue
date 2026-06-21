<template>
  <div class="h-full overflow-auto bg-gray-50">
    <div class="max-w-5xl mx-auto p-6">
      <div class="mb-6 flex items-center gap-3">
        <n-button text @click="router.back()">
          <template #icon>
            <n-icon><MdArrowBack /></n-icon>
          </template>
        </n-button>
        <div>
          <h2 class="text-2xl font-bold text-gray-800">物品详情</h2>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <n-spin size="large" />
      </div>

      <div v-else-if="item" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="aspect-video bg-gray-100 relative">
              <img
                v-if="photoList.length > 0"
                :src="photoList[currentPhotoIndex]"
                :alt="item.name"
                class="w-full h-full object-contain"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <n-icon size="64" class="text-gray-300"><MdCube /></n-icon>
              </div>

              <div v-if="photoList.length > 1" class="absolute inset-y-0 left-0 flex items-center">
                <n-button
                  circle
                  size="small"
                  class="ml-2 !bg-white/80 hover:!bg-white"
                  @click="prevPhoto"
                >
                  <template #icon>
                    <n-icon><MdArrowBack /></n-icon>
                  </template>
                </n-button>
              </div>
              <div v-if="photoList.length > 1" class="absolute inset-y-0 right-0 flex items-center">
                <n-button
                  circle
                  size="small"
                  class="mr-2 !bg-white/80 hover:!bg-white"
                  @click="nextPhoto"
                >
                  <template #icon>
                    <n-icon><MdArrowForward /></n-icon>
                  </template>
                </n-button>
              </div>

              <div class="absolute top-3 left-3 flex gap-2">
                <n-tag
                  :type="item.status === 'available' ? 'success' : item.status === 'borrowed' ? 'warning' : 'default'"
                  round
                >
                  {{ ITEM_STATUS[item.status] }}
                </n-tag>
              </div>
            </div>

            <div v-if="photoList.length > 1" class="p-4 border-t border-gray-100 flex gap-2 overflow-x-auto">
              <div
                v-for="(photo, index) in photoList"
                :key="index"
                class="w-16 h-16 flex-none rounded-lg overflow-hidden cursor-pointer border-2"
                :class="currentPhotoIndex === index ? 'border-[#18a058]' : 'border-transparent'"
                @click="currentPhotoIndex = index"
              >
                <img :src="photo" class="w-full h-full object-cover" />
              </div>
            </div>

            <div class="p-6">
              <h1 class="text-2xl font-bold text-gray-800 mb-4">{{ item.name }}</h1>

              <div class="flex flex-wrap gap-2 mb-4">
                <n-tag type="info" round>
                  {{ getConditionLabel(item.condition) }}
                </n-tag>
                <n-tag v-if="item.isFreeDeposit || item.deposit === 0" type="success" round>
                  免押金
                </n-tag>
                <n-tag v-else round>
                  押金 ¥{{ item.deposit }}
                </n-tag>
              </div>

              <div v-if="item.description" class="mb-6">
                <h3 class="text-sm font-medium text-gray-700 mb-2">物品描述</h3>
                <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {{ item.description }}
                </p>
              </div>

              <div v-if="item.availableSlots" class="mb-6">
                <h3 class="text-sm font-medium text-gray-700 mb-2">可借用时段</h3>
                <p class="text-gray-600 text-sm">{{ item.availableSlots }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-white rounded-xl shadow-sm p-5">
            <h3 class="text-sm font-medium text-gray-700 mb-4">物品主人</h3>
            <div class="flex items-center gap-3 mb-4">
              <n-avatar round size="large" :src="item.owner?.avatar">
                {{ item.owner?.nickname?.charAt(0) || item.owner?.phone?.slice(-4) }}
              </n-avatar>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-800 truncate">
                    {{ item.owner?.nickname || item.owner?.phone }}
                  </span>
                  <span
                    v-if="item.owner && websocketService.isUserOnline(item.owner.id)"
                    class="flex-none flex items-center gap-1 text-xs text-green-500"
                  >
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    在线
                  </span>
                </div>
                <p v-if="item.owner?.roomNo" class="text-xs text-gray-500 mt-1">
                  {{ item.owner.roomNo }}
                </p>
              </div>
            </div>

            <n-space vertical style="width: 100%">
              <n-button
                block
                type="primary"
                :disabled="item.isOwner || item.status !== 'available'"
                @click="openBorrowDialog"
              >
                <template v-if="item.isOwner">这是您的物品</template>
                <template v-else-if="item.status !== 'available'">{{ ITEM_STATUS[item.status] }}</template>
                <template v-else>申请借用</template>
              </n-button>
              <n-button
                v-if="!item.isOwner"
                block
                @click="contactOwner"
              >
                <template #icon>
                  <n-icon><MdChatbubbles /></n-icon>
                </template>
                私信联系
              </n-button>
              <n-button
                v-if="item.isOwner"
                block
                type="warning"
                @click="editItem"
              >
                <template #icon>
                  <n-icon><MdCreate /></n-icon>
                </template>
                编辑物品
              </n-button>
            </n-space>
          </div>

          <div v-if="item.isOwner" class="bg-white rounded-xl shadow-sm p-5">
            <h3 class="text-sm font-medium text-gray-700 mb-4">物品操作</h3>
            <n-space vertical style="width: 100%">
              <n-select
                v-model:value="statusUpdateValue"
                :options="statusOptions"
                placeholder="修改物品状态"
              />
              <n-button
                block
                :disabled="!statusUpdateValue || statusUpdateValue === item.status"
                @click="updateItemStatus"
              >
                更新状态
              </n-button>
              <n-popconfirm @positive-click="handleDelete">
                <template #trigger>
                  <n-button block type="error" ghost>
                    删除物品
                  </n-button>
                </template>
                确认要删除这个物品吗？删除后无法恢复。
              </n-popconfirm>
            </n-space>
          </div>
        </div>
      </div>

      <n-modal v-model:show="showBorrowDialog" preset="card" title="申请借用" style="width: 480px">
        <n-form ref="borrowFormRef" :model="borrowForm" :rules="borrowRules" label-placement="top">
          <n-form-item label="借用开始时间" path="expectedStartDate">
            <n-date-picker
              v-model:value="borrowForm.expectedStartDate"
              type="datetime"
              placeholder="选择开始时间"
              style="width: 100%"
            />
          </n-form-item>
          <n-form-item label="归还时间" path="expectedEndDate">
            <n-date-picker
              v-model:value="borrowForm.expectedEndDate"
              type="datetime"
              placeholder="选择归还时间"
              style="width: 100%"
            />
          </n-form-item>
          <n-form-item label="借用说明" path="remark">
            <n-input
              v-model:value="borrowForm.remark"
              type="textarea"
              placeholder="请说明您的用途或其他需要说明的事项（选填）"
              :autosize="{ minRows: 3, maxRows: 5 }"
              maxlength="200"
              show-count
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showBorrowDialog = false">取消</n-button>
            <n-button type="primary" :loading="borrowSubmitting" @click="submitBorrowRequest">
              提交申请
            </n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, type FormInst, type FormRules } from 'naive-ui'
import {
  MdArrowBack,
  MdArrowForward,
  MdCube,
  MdChatbubbles,
  MdCreate,
} from '@vicons/ionicons4'
import dayjs from 'dayjs'
import {
  getItemDetail,
  createBorrowRequest,
  updateItem,
  deleteItem,
} from '@/api/borrow'
import { createOrGetConversation as createMsgConversation } from '@/api/message'
import { ITEM_CONDITION_OPTIONS, ITEM_STATUS, type Item } from '@/types'
import { websocketService } from '@/utils/websocket'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const loading = ref(false)
const item = ref<Item | null>(null)
const currentPhotoIndex = ref(0)
const photoList = ref<string[]>([])

const showBorrowDialog = ref(false)
const borrowSubmitting = ref(false)
const borrowFormRef = ref<FormInst | null>(null)
const borrowForm = reactive({
  expectedStartDate: null as number | null,
  expectedEndDate: null as number | null,
  remark: '',
})

const borrowRules: FormRules = {
  expectedStartDate: [
    {
      required: true,
      type: 'number',
      message: '请选择借用开始时间',
      trigger: 'change',
    },
    {
      validator: (_rule, value) => {
        if (value && value < Date.now() - 60000) {
          return new Error('开始时间不能早于当前时间')
        }
        return true
      },
      trigger: 'change',
    },
  ],
  expectedEndDate: [
    {
      required: true,
      type: 'number',
      message: '请选择归还时间',
      trigger: 'change',
    },
    {
      validator: (_rule, value) => {
        if (value && borrowForm.expectedStartDate && value <= borrowForm.expectedStartDate) {
          return new Error('归还时间必须晚于开始时间')
        }
        return true
      },
      trigger: 'change',
    },
  ],
}

const statusUpdateValue = ref<string | null>(null)
const statusOptions = [
  { label: '可借用', value: 'available' },
  { label: '不可用', value: 'unavailable' },
]

function getConditionLabel(condition: string) {
  const opt = ITEM_CONDITION_OPTIONS.find((o) => o.value === condition)
  return opt?.label || condition
}

function parsePhotos(photos: string) {
  if (!photos) return []
  try {
    const arr = JSON.parse(photos)
    return Array.isArray(arr) ? arr : [photos]
  } catch (e) {
    return [photos]
  }
}

function prevPhoto() {
  if (photoList.value.length === 0) return
  currentPhotoIndex.value = (currentPhotoIndex.value - 1 + photoList.value.length) % photoList.value.length
}

function nextPhoto() {
  if (photoList.value.length === 0) return
  currentPhotoIndex.value = (currentPhotoIndex.value + 1) % photoList.value.length
}

async function fetchItemDetail() {
  const id = Number(route.params.id)
  if (!id) {
    router.push('/borrow')
    return
  }

  try {
    loading.value = true
    const res: any = await getItemDetail(id)
    item.value = res
    photoList.value = parsePhotos(res.photos)
    statusUpdateValue.value = res.status
  } catch (e: any) {
    message.error(e.message || '获取物品详情失败')
  } finally {
    loading.value = false
  }
}

function openBorrowDialog() {
  borrowForm.expectedStartDate = dayjs().add(1, 'hour').startOf('hour').valueOf()
  borrowForm.expectedEndDate = dayjs().add(1, 'day').startOf('hour').valueOf()
  borrowForm.remark = ''
  showBorrowDialog.value = true
}

async function submitBorrowRequest() {
  if (!borrowFormRef.value || !item.value) return

  try {
    await borrowFormRef.value.validate()
  } catch (e) {
    return
  }

  try {
    borrowSubmitting.value = true
    await createBorrowRequest({
      itemId: item.value.id,
      expectedStartDate: dayjs(borrowForm.expectedStartDate).toISOString(),
      expectedEndDate: dayjs(borrowForm.expectedEndDate).toISOString(),
      remark: borrowForm.remark || undefined,
    })

    message.success('申请已提交，请等待物品主人审批')
    showBorrowDialog.value = false

    setTimeout(() => {
      router.push('/borrow/manage')
    }, 800)
  } catch (e: any) {
    message.error(e.message || '提交申请失败')
  } finally {
    borrowSubmitting.value = false
  }
}

async function contactOwner() {
  if (!item.value?.owner?.id) return
  try {
    const res: any = await createMsgConversation(item.value.owner.id)
    if (res?.id) {
      router.push(`/messages/${res.id}`)
    }
  } catch (e: any) {
    message.error(e.message || '创建会话失败')
  }
}

function editItem() {
  router.push(`/borrow/publish?id=${item.value?.id}`, { state: { id: item.value?.id } })
}

async function updateItemStatus() {
  if (!item.value || !statusUpdateValue.value) return
  try {
    await updateItem(item.value.id, { status: statusUpdateValue.value })
    message.success('状态更新成功')
    fetchItemDetail()
  } catch (e: any) {
    message.error(e.message || '状态更新失败')
  }
}

async function handleDelete() {
  if (!item.value) return
  try {
    await deleteItem(item.value.id)
    message.success('删除成功')
    setTimeout(() => {
      router.push('/borrow/manage')
    }, 500)
  } catch (e: any) {
    message.error(e.message || '删除失败')
  }
}

onMounted(() => {
  fetchItemDetail()
  if (!websocketService.isConnected.value) {
    websocketService.connect()
  }
})
</script>
