<template>
  <div class="h-full overflow-auto bg-gray-50">
    <div class="max-w-6xl mx-auto p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">借用管理</h2>
          <p class="text-sm text-gray-500 mt-1">管理您的物品和借用记录</p>
        </div>
        <n-button type="primary" @click="router.push('/borrow/publish')">
          <template #icon>
            <n-icon><MdAdd /></n-icon>
          </template>
          登记新物品
        </n-button>
      </div>

      <div v-if="statsLoading" class="flex justify-center py-12">
        <n-spin size="large" />
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-1">我的物品</div>
          <div class="text-2xl font-bold text-gray-800">{{ stats.myItems }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-1">待审批申请</div>
          <div class="text-2xl font-bold text-orange-500">{{ stats.pendingRequests }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-1">借出中</div>
          <div class="text-2xl font-bold text-blue-500">{{ stats.lendingOut }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5">
          <div class="text-sm text-gray-500 mb-1">借用中</div>
          <div class="text-2xl font-bold text-[#18a058]">{{ stats.borrowing }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-5 col-span-2 md:col-span-1">
          <div class="text-sm text-gray-500 mb-1">已逾期</div>
          <div class="text-2xl font-bold text-red-500">{{ stats.overdue }}</div>
        </div>
      </div>

      <n-tabs v-model:value="activeTab" type="line" size="large" animated>
        <n-tab-pane name="my-items" tab="我的物品">
          <div v-if="itemsLoading" class="flex justify-center py-12">
            <n-spin />
          </div>
          <div v-else-if="myItems.length === 0" class="bg-white rounded-xl shadow-sm py-16 text-center">
            <n-icon size="48" class="text-gray-300 mb-3"><MdCube /></n-icon>
            <p class="text-gray-400 mb-4">您还没有登记任何物品</p>
            <n-button type="primary" @click="router.push('/borrow/publish')">去登记物品</n-button>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="item in myItems"
              :key="item.id"
              class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              @click="router.push(`/borrow/${item.id}`)"
            >
              <div class="aspect-[4/3] bg-gray-100 relative">
                <img
                  v-if="getFirstPhoto(item.photos)"
                  :src="getFirstPhoto(item.photos)"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <n-icon size="40" class="text-gray-300"><MdCube /></n-icon>
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
              </div>
              <div class="p-4">
                <h3 class="font-medium text-gray-800 mb-2 truncate">{{ item.name }}</h3>
                <div class="flex items-center gap-2">
                  <n-tag size="small" round>
                    {{ getConditionLabel(item.condition) }}
                  </n-tag>
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="pending" tab="待审批">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div v-if="requestsLoading" class="flex justify-center py-12">
              <n-spin />
            </div>
            <div v-else-if="receivedPendingRequests.length === 0" class="py-16 text-center">
              <n-icon size="48" class="text-gray-300 mb-3"><MdCheckmarkCircleOutline /></n-icon>
              <p class="text-gray-400">暂无待审批的申请</p>
            </div>
            <div v-else class="divide-y divide-gray-100">
              <div
                v-for="req in receivedPendingRequests"
                :key="req.id"
                class="p-5 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-start gap-4">
                  <div class="w-20 h-20 flex-none rounded-lg bg-gray-100 overflow-hidden">
                    <img
                      v-if="getFirstPhoto(req.item?.photos)"
                      :src="getFirstPhoto(req.item?.photos)"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <n-icon size="24" class="text-gray-300"><MdCube /></n-icon>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <h4 class="font-medium text-gray-800">{{ req.item?.name }}</h4>
                        <p class="text-sm text-gray-500 mt-1">
                          申请人：{{ req.borrower?.nickname || req.borrower?.phone }}
                        </p>
                      </div>
                      <n-tag type="warning" round>待审批</n-tag>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="text-gray-500">借用时间：</span>
                        <span class="text-gray-700">{{ formatDateTime(req.expectedStartDate) }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500">归还时间：</span>
                        <span class="text-gray-700">{{ formatDateTime(req.expectedEndDate) }}</span>
                      </div>
                    </div>
                    <div v-if="req.remark" class="mt-2 text-sm">
                      <span class="text-gray-500">备注：</span>
                      <span class="text-gray-700">{{ req.remark }}</span>
                    </div>
                    <div class="mt-4 flex items-center gap-3">
                      <n-button
                        type="primary"
                        size="small"
                        @click.stop="handleApprove(req.id)"
                      >
                        通过申请
                      </n-button>
                      <n-button
                        size="small"
                        @click.stop="showRejectDialog(req.id)"
                      >
                        拒绝
                      </n-button>
                      <n-button
                        text
                        size="small"
                        @click.stop="router.push(`/borrow/${req.itemId}`)"
                      >
                        查看物品
                      </n-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="lending" tab="借出中">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div v-if="recordsLoading" class="flex justify-center py-12">
              <n-spin />
            </div>
            <div v-else-if="lendingRecords.length === 0" class="py-16 text-center">
              <n-icon size="48" class="text-gray-300 mb-3"><MdShare /></n-icon>
              <p class="text-gray-400">当前没有借出中的物品</p>
            </div>
            <div v-else class="divide-y divide-gray-100">
              <div
                v-for="record in lendingRecords"
                :key="record.id"
                class="p-5 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-start gap-4">
                  <div class="w-20 h-20 flex-none rounded-lg bg-gray-100 overflow-hidden">
                    <img
                      v-if="getFirstPhoto(record.item?.photos)"
                      :src="getFirstPhoto(record.item?.photos)"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <n-icon size="24" class="text-gray-300"><MdCube /></n-icon>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <h4 class="font-medium text-gray-800">{{ record.item?.name }}</h4>
                        <p class="text-sm text-gray-500 mt-1">
                          借用人：{{ record.borrower?.nickname || record.borrower?.phone }}
                        </p>
                      </div>
                      <n-tag
                        :type="record.status === 'overdue' ? 'error' : 'warning'"
                        round
                      >
                        {{ BORROW_RECORD_STATUS[record.status] }}
                      </n-tag>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="text-gray-500">借出时间：</span>
                        <span class="text-gray-700">{{ formatDateTime(record.startDate) }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500">应归还：</span>
                        <span :class="record.status === 'overdue' ? 'text-red-500' : 'text-gray-700'">
                          {{ formatDateTime(record.expectedReturnDate) }}
                        </span>
                      </div>
                    </div>
                    <div class="mt-4 flex items-center gap-3">
                      <n-popconfirm
                        v-if="record.status === 'borrowing' || record.status === 'overdue'"
                        @positive-click="handleReturn(record.id)"
                      >
                        <template #trigger>
                          <n-button type="primary" size="small">
                            确认归还
                          </n-button>
                        </template>
                        已确认物品完好并收回？
                      </n-popconfirm>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="my-borrowing" tab="我在借用">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div v-if="borrowingRecordsLoading" class="flex justify-center py-12">
              <n-spin />
            </div>
            <div v-else-if="myBorrowingRecords.length === 0" class="py-16 text-center">
              <n-icon size="48" class="text-gray-300 mb-3"><MdCube /></n-icon>
              <p class="text-gray-400">您当前没有借用中的物品</p>
              <n-button type="primary" class="mt-4" @click="router.push('/borrow')">
                去看看可借物品
              </n-button>
            </div>
            <div v-else class="divide-y divide-gray-100">
              <div
                v-for="record in myBorrowingRecords"
                :key="record.id"
                class="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="router.push(`/borrow/${record.itemId}`)"
              >
                <div class="flex items-start gap-4">
                  <div class="w-20 h-20 flex-none rounded-lg bg-gray-100 overflow-hidden">
                    <img
                      v-if="getFirstPhoto(record.item?.photos)"
                      :src="getFirstPhoto(record.item?.photos)"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <n-icon size="24" class="text-gray-300"><MdCube /></n-icon>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <h4 class="font-medium text-gray-800">{{ record.item?.name }}</h4>
                        <p class="text-sm text-gray-500 mt-1">
                          物品主人：{{ record.owner?.nickname || record.owner?.phone }}
                        </p>
                      </div>
                      <n-tag
                        :type="record.status === 'overdue' ? 'error' : 'info'"
                        round
                      >
                        {{ BORROW_RECORD_STATUS[record.status] }}
                      </n-tag>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="text-gray-500">借入时间：</span>
                        <span class="text-gray-700">{{ formatDateTime(record.startDate) }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500">应归还：</span>
                        <span :class="record.status === 'overdue' ? 'text-red-500 font-medium' : 'text-gray-700'">
                          {{ formatDateTime(record.expectedReturnDate) }}
                        </span>
                      </div>
                    </div>
                    <div v-if="record.status === 'overdue'" class="mt-2">
                      <n-alert type="error" :show-icon="true">
                        您借用的物品已逾期，请尽快归还
                      </n-alert>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="my-requests" tab="我的申请">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div v-if="myRequestsLoading" class="flex justify-center py-12">
              <n-spin />
            </div>
            <div v-else-if="myBorrowRequests.length === 0" class="py-16 text-center">
              <n-icon size="48" class="text-gray-300 mb-3"><MdPaper /></n-icon>
              <p class="text-gray-400">您还没有提交过借用申请</p>
            </div>
            <div v-else class="divide-y divide-gray-100">
              <div
                v-for="req in myBorrowRequests"
                :key="req.id"
                class="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="router.push(`/borrow/${req.itemId}`)"
              >
                <div class="flex items-start gap-4">
                  <div class="w-20 h-20 flex-none rounded-lg bg-gray-100 overflow-hidden">
                    <img
                      v-if="getFirstPhoto(req.item?.photos)"
                      :src="getFirstPhoto(req.item?.photos)"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <n-icon size="24" class="text-gray-300"><MdCube /></n-icon>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <h4 class="font-medium text-gray-800">{{ req.item?.name }}</h4>
                      </div>
                      <n-tag
                        :type="req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'error' : 'default'"
                        round
                      >
                        {{ BORROW_REQUEST_STATUS[req.status] }}
                      </n-tag>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="text-gray-500">申请时间：</span>
                        <span class="text-gray-700">{{ formatDateTime(req.createdAt) }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500">预期归还：</span>
                        <span class="text-gray-700">{{ formatDateTime(req.expectedEndDate) }}</span>
                      </div>
                    </div>
                    <div v-if="req.status === 'rejected' && req.rejectReason" class="mt-2 text-sm text-red-500">
                      拒绝原因：{{ req.rejectReason }}
                    </div>
                    <div class="mt-4" v-if="req.status === 'pending'">
                      <n-button
                        size="small"
                        @click.stop="handleCancelRequest(req.id)"
                      >
                        取消申请
                      </n-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>

      <n-modal v-model:show="showRejectModal" preset="card" title="拒绝申请" style="width: 420px">
        <n-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-placement="top">
          <n-form-item label="拒绝原因" path="rejectReason">
            <n-input
              v-model:value="rejectForm.rejectReason"
              type="textarea"
              placeholder="请输入拒绝原因"
              :autosize="{ minRows: 3, maxRows: 5 }"
              maxlength="200"
              show-count
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showRejectModal = false">取消</n-button>
            <n-button type="error" :loading="rejectSubmitting" @click="submitReject">
              确认拒绝
            </n-button>
          </n-space>
        </template>
      </n-modal>

      <n-modal v-model:show="showReturnModal" preset="card" title="确认归还" style="width: 480px">
        <n-form ref="returnFormRef" :model="returnForm" :rules="returnRules" label-placement="top">
          <n-form-item label="损坏赔偿（元）" path="actualDamageCost">
            <n-input-number
              v-model:value="returnForm.actualDamageCost"
              :min="0"
              :max="10000"
              placeholder="物品完好则填0"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-form-item>
          <n-form-item label="归还备注" path="returnRemark">
            <n-input
              v-model:value="returnForm.returnRemark"
              type="textarea"
              placeholder="描述归还情况（选填）"
              :autosize="{ minRows: 2, maxRows: 4 }"
              maxlength="200"
              show-count
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showReturnModal = false">取消</n-button>
            <n-button type="primary" :loading="returnSubmitting" @click="submitReturn">
              确认归还
            </n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, type FormInst, type FormRules } from 'naive-ui'
import {
  MdAdd,
  MdCube,
  MdCheckmarkCircleOutline,
  MdShare,
  MdPaper,
} from '@vicons/ionicons4'
import dayjs from 'dayjs'
import {
  getBorrowStatistics,
  getMyItems,
  getReceivedBorrowRequests,
  getMyBorrowRequests,
  getMyBorrowRecords,
  getMyLentRecords,
  processBorrowRequest,
  cancelBorrowRequest,
  returnItem,
} from '@/api/borrow'
import {
  ITEM_CONDITION_OPTIONS,
  ITEM_STATUS,
  BORROW_REQUEST_STATUS,
  BORROW_RECORD_STATUS,
  type Item,
  type BorrowRequest,
  type BorrowRecord,
} from '@/types'

const router = useRouter()
const message = useMessage()

const activeTab = ref('my-items')

const stats = reactive({
  myItems: 0,
  pendingRequests: 0,
  lendingOut: 0,
  borrowing: 0,
  overdue: 0,
})
const statsLoading = ref(false)

const itemsLoading = ref(false)
const myItems = ref<Item[]>([])

const requestsLoading = ref(false)
const receivedPendingRequests = ref<BorrowRequest[]>([])

const recordsLoading = ref(false)
const lendingRecords = ref<BorrowRecord[]>([])

const borrowingRecordsLoading = ref(false)
const myBorrowingRecords = ref<BorrowRecord[]>([])

const myRequestsLoading = ref(false)
const myBorrowRequests = ref<BorrowRequest[]>([])

const showRejectModal = ref(false)
const rejectSubmitting = ref(false)
const rejectFormRef = ref<FormInst | null>(null)
const rejectTargetId = ref<number | null>(null)
const rejectForm = reactive({
  rejectReason: '',
})
const rejectRules: FormRules = {
  rejectReason: [
    { required: true, message: '请输入拒绝原因', trigger: 'blur' },
    { min: 2, max: 200, message: '长度2-200个字符', trigger: 'blur' },
  ],
}

const showReturnModal = ref(false)
const returnSubmitting = ref(false)
const returnFormRef = ref<FormInst | null>(null)
const returnTargetId = ref<number | null>(null)
const returnForm = reactive({
  actualDamageCost: 0,
  returnRemark: '',
})
const returnRules: FormRules = {
  actualDamageCost: [
    { required: true, type: 'number', message: '请输入赔偿金额', trigger: 'change' },
  ],
}

function getFirstPhoto(photos?: string) {
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

function formatDateTime(time?: string | Date) {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function fetchStats() {
  try {
    statsLoading.value = true
    const res: any = await getBorrowStatistics()
    Object.assign(stats, res)
  } catch (e: any) {
    console.error('获取统计数据失败', e)
  } finally {
    statsLoading.value = false
  }
}

async function fetchMyItems() {
  try {
    itemsLoading.value = true
    const res: any = await getMyItems({ pageSize: 100 })
    myItems.value = res?.list || res || []
  } catch (e: any) {
    message.error(e.message || '获取物品列表失败')
  } finally {
    itemsLoading.value = false
  }
}

async function fetchPendingRequests() {
  try {
    requestsLoading.value = true
    const res: any = await getReceivedBorrowRequests({
      status: 'pending',
      pageSize: 100,
    })
    receivedPendingRequests.value = res?.list || res || []
  } catch (e: any) {
    message.error(e.message || '获取申请列表失败')
  } finally {
    requestsLoading.value = false
  }
}

async function fetchLendingRecords() {
  try {
    recordsLoading.value = true
    const res: any = await getMyLentRecords({
      status: 'borrowing',
      pageSize: 100,
    })
    const res2: any = await getMyLentRecords({
      status: 'overdue',
      pageSize: 100,
    })
    const list1 = res?.list || res || []
    const list2 = res2?.list || res2 || []
    lendingRecords.value = [...list1, ...list2].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  } catch (e: any) {
    message.error(e.message || '获取借出记录失败')
  } finally {
    recordsLoading.value = false
  }
}

async function fetchMyBorrowing() {
  try {
    borrowingRecordsLoading.value = true
    const res: any = await getMyBorrowRecords({
      status: 'borrowing',
      pageSize: 100,
    })
    const res2: any = await getMyBorrowRecords({
      status: 'overdue',
      pageSize: 100,
    })
    const list1 = res?.list || res || []
    const list2 = res2?.list || res2 || []
    myBorrowingRecords.value = [...list1, ...list2].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  } catch (e: any) {
    message.error(e.message || '获取借用记录失败')
  } finally {
    borrowingRecordsLoading.value = false
  }
}

async function fetchMyRequests() {
  try {
    myRequestsLoading.value = true
    const res: any = await getMyBorrowRequests({ pageSize: 100 })
    myBorrowRequests.value = res?.list || res || []
  } catch (e: any) {
    message.error(e.message || '获取申请列表失败')
  } finally {
    myRequestsLoading.value = false
  }
}

async function handleApprove(requestId: number) {
  try {
    await processBorrowRequest(requestId, { status: 'approved' })
    message.success('已通过申请，借用记录已生成')
    fetchAll()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  }
}

function showRejectDialog(requestId: number) {
  rejectTargetId.value = requestId
  rejectForm.rejectReason = ''
  showRejectModal.value = true
}

async function submitReject() {
  if (!rejectFormRef.value || rejectTargetId.value === null) return

  try {
    await rejectFormRef.value.validate()
  } catch (e) {
    return
  }

  try {
    rejectSubmitting.value = true
    await processBorrowRequest(rejectTargetId.value, {
      status: 'rejected',
      rejectReason: rejectForm.rejectReason,
    })
    message.success('已拒绝申请')
    showRejectModal.value = false
    fetchAll()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    rejectSubmitting.value = false
  }
}

async function handleCancelRequest(requestId: number) {
  try {
    await cancelBorrowRequest(requestId)
    message.success('已取消申请')
    fetchAll()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  }
}

function handleReturn(recordId: number) {
  returnTargetId.value = recordId
  returnForm.actualDamageCost = 0
  returnForm.returnRemark = ''
  showReturnModal.value = true
}

async function submitReturn() {
  if (!returnFormRef.value || returnTargetId.value === null) return

  try {
    await returnFormRef.value.validate()
  } catch (e) {
    return
  }

  try {
    returnSubmitting.value = true
    await returnItem(returnTargetId.value, {
      actualDamageCost: returnForm.actualDamageCost,
      returnRemark: returnForm.returnRemark || undefined,
    })
    message.success('归还已确认')
    showReturnModal.value = false
    fetchAll()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    returnSubmitting.value = false
  }
}

function fetchAll() {
  fetchStats()
  fetchMyItems()
  fetchPendingRequests()
  fetchLendingRecords()
  fetchMyBorrowing()
  fetchMyRequests()
}

watch(activeTab, (tab) => {
  switch (tab) {
    case 'my-items':
      fetchMyItems()
      break
    case 'pending':
      fetchPendingRequests()
      break
    case 'lending':
      fetchLendingRecords()
      break
    case 'my-borrowing':
      fetchMyBorrowing()
      break
    case 'my-requests':
      fetchMyRequests()
      break
  }
})

onMounted(() => {
  fetchAll()
})
</script>
