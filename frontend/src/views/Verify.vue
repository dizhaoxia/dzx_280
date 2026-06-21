<template>
  <div class="p-6 max-w-2xl mx-auto">
    <n-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span>实名认证</span>
          <n-tag :type="statusTagType" size="small">
            {{ statusText }}
          </n-tag>
        </div>
      </template>

      <div v-if="isVerified" class="space-y-4">
        <n-alert type="success" title="认证成功">
          您的信息已通过认证，无需重复提交。
        </n-alert>
        <div v-if="userStore.user?.idCardFront" class="space-y-3">
          <p class="font-medium">身份证照片：</p>
          <div class="flex gap-4">
            <div class="w-48">
              <p class="text-sm text-gray-500 mb-2">正面</p>
              <n-image :src="userStore.user.idCardFront" width="192" height="120" object-fit="cover" />
            </div>
            <div v-if="userStore.user.idCardBack" class="w-48">
              <p class="text-sm text-gray-500 mb-2">背面</p>
              <n-image :src="userStore.user.idCardBack" width="192" height="120" object-fit="cover" />
            </div>
          </div>
        </div>
        <div v-if="userStore.user?.propertyCertNo" class="space-y-2">
          <p class="font-medium">房产信息：</p>
          <p class="text-sm text-gray-600">楼栋：{{ userStore.user.building?.name || '-' }}</p>
          <p class="text-sm text-gray-600">房号：{{ userStore.user.roomNo || '-' }}</p>
          <p class="text-sm text-gray-600">房产证号：{{ userStore.user.propertyCertNo }}</p>
        </div>
      </div>

      <div v-else>
        <div v-if="userStore.user?.verifyStatus === 'pending'" class="mb-4">
          <n-alert type="warning" title="审核中">
            您的认证信息正在审核中，请耐心等待。
          </n-alert>
        </div>
        <div v-else-if="userStore.user?.verifyStatus === 'rejected'" class="mb-4">
          <n-alert type="error" title="认证已拒绝">
            您的认证申请未通过，请重新提交。
          </n-alert>
        </div>

        <n-tabs type="line" v-model:value="activeTab">
          <n-tab-pane name="idcard" tab="身份证认证">
            <n-form
              ref="idCardFormRef"
              :model="idCardForm"
              :rules="idCardRules"
              label-placement="top"
              class="mt-4"
            >
              <n-form-item label="身份证正面" path="front">
                <n-upload
                  v-model:file-list="frontFileList"
                  :max="1"
                  :show-file-list="true"
                  accept="image/*"
                  list-type="image-card"
                  :custom-request="() => {}"
                >
                  点击上传
                </n-upload>
              </n-form-item>
              <n-form-item label="身份证背面" path="back">
                <n-upload
                  v-model:file-list="backFileList"
                  :max="1"
                  :show-file-list="true"
                  accept="image/*"
                  list-type="image-card"
                  :custom-request="() => {}"
                >
                  点击上传
                </n-upload>
              </n-form-item>
              <n-form-item>
                <n-button type="primary" :loading="idCardLoading" @click="submitIdCard">
                  提交审核
                </n-button>
              </n-form-item>
            </n-form>
          </n-tab-pane>

          <n-tab-pane name="property" tab="房产认证">
            <n-form
              ref="propertyFormRef"
              :model="propertyForm"
              :rules="propertyRules"
              label-placement="top"
              class="mt-4"
            >
              <n-form-item label="选择楼栋" path="buildingId">
                <n-select
                  v-model:value="propertyForm.buildingId"
                  :options="buildingOptions"
                  placeholder="请选择楼栋"
                  :loading="buildingLoading"
                />
              </n-form-item>
              <n-form-item label="房号" path="roomNo">
                <n-input v-model:value="propertyForm.roomNo" placeholder="请输入房号，如：301" />
              </n-form-item>
              <n-form-item label="房产证号" path="propertyCertNo">
                <n-input v-model:value="propertyForm.propertyCertNo" placeholder="请输入房产证号" />
              </n-form-item>
              <n-form-item>
                <n-button type="primary" :loading="propertyLoading" @click="submitProperty">
                  提交审核
                </n-button>
              </n-form-item>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useMessage, type FormRules, type FormInst, type UploadFileInfo } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { verifyByIdCard, verifyByProperty } from '@/api/user'
import { getBuildingList } from '@/api/building'
import { VERIFY_STATUS, type Building } from '@/types'

const message = useMessage()
const userStore = useUserStore()

const activeTab = ref('idcard')
const idCardLoading = ref(false)
const propertyLoading = ref(false)
const buildingLoading = ref(false)

const idCardFormRef = ref<FormInst | null>(null)
const propertyFormRef = ref<FormInst | null>(null)

const frontFileList = ref<UploadFileInfo[]>([])
const backFileList = ref<UploadFileInfo[]>([])

const idCardForm = reactive({
  front: null as File | null,
  back: null as File | null,
})

const propertyForm = reactive({
  buildingId: null as number | null,
  roomNo: '',
  propertyCertNo: '',
})

const buildingOptions = ref<{ label: string; value: number }[]>([])

const idCardRules: FormRules = {
  front: [
    {
      required: true,
      validator: () => {
        if (frontFileList.value.length === 0) {
          return new Error('请上传身份证正面')
        }
        return true
      },
      trigger: 'change',
    },
  ],
  back: [
    {
      required: true,
      validator: () => {
        if (backFileList.value.length === 0) {
          return new Error('请上传身份证背面')
        }
        return true
      },
      trigger: 'change',
    },
  ],
}

const propertyRules: FormRules = {
  buildingId: [
    {
      required: true,
      message: '请选择楼栋',
      trigger: 'change',
    },
  ],
  roomNo: [
    {
      required: true,
      message: '请输入房号',
      trigger: 'blur',
    },
  ],
  propertyCertNo: [
    {
      required: true,
      message: '请输入房产证号',
      trigger: 'blur',
    },
  ],
}

const statusText = computed(() => {
  return VERIFY_STATUS[userStore.user?.verifyStatus || 'unverified'] || '未认证'
})

const statusTagType = computed(() => {
  const status = userStore.user?.verifyStatus
  if (status === 'verified') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'rejected') return 'error'
  return 'default'
})

const isVerified = computed(() => userStore.user?.verifyStatus === 'verified')

async function fetchBuildings() {
  buildingLoading.value = true
  try {
    const res: any = await getBuildingList()
    const list: Building[] = res.list || res || []
    buildingOptions.value = list.map((b) => ({
      label: b.name,
      value: b.id,
    }))
  } catch (e: any) {
    message.error(e?.message || '获取楼栋列表失败')
  } finally {
    buildingLoading.value = false
  }
}

async function submitIdCard() {
  try {
    await idCardFormRef.value?.validate()
  } catch (e) {
    return
  }
  if (!frontFileList.value[0]?.file || !backFileList.value[0]?.file) {
    message.error('请上传完整的身份证照片')
    return
  }
  idCardLoading.value = true
  try {
    const formData = new FormData()
    formData.append('front', frontFileList.value[0].file as File)
    formData.append('back', backFileList.value[0].file as File)
    await verifyByIdCard(formData)
    message.success('提交成功，等待审核')
    await userStore.fetchProfile()
  } catch (e: any) {
    message.error(e?.message || '提交失败')
  } finally {
    idCardLoading.value = false
  }
}

async function submitProperty() {
  try {
    await propertyFormRef.value?.validate()
  } catch (e) {
    return
  }
  propertyLoading.value = true
  try {
    await verifyByProperty({
      buildingId: propertyForm.buildingId!,
      roomNo: propertyForm.roomNo,
      propertyCertNo: propertyForm.propertyCertNo,
    })
    message.success('提交成功，等待审核')
    await userStore.fetchProfile()
  } catch (e: any) {
    message.error(e?.message || '提交失败')
  } finally {
    propertyLoading.value = false
  }
}

onMounted(() => {
  fetchBuildings()
})
</script>
