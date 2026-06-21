<template>
  <div class="help-publish-page p-6 max-w-3xl mx-auto">
    <n-card title="发布互助" hoverable>
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="类型" path="type">
          <n-radio-group v-model:value="formData.type">
            <n-radio value="request">求帮助</n-radio>
            <n-radio value="offer">提供帮助</n-radio>
          </n-radio-group>
        </n-form-item>

        <n-form-item label="分类" path="category">
          <n-select
            v-model:value="formData.category"
            placeholder="请选择分类"
            :options="categoryOptions"
            style="max-width: 320px"
          />
        </n-form-item>

        <n-form-item label="紧急程度" path="urgency">
          <n-radio-group v-model:value="formData.urgency">
            <n-radio value="normal">普通</n-radio>
            <n-radio value="urgent">紧急</n-radio>
          </n-radio-group>
        </n-form-item>

        <n-form-item label="标题" path="title">
          <n-input
            v-model:value="formData.title"
            placeholder="请输入标题，简洁明了描述需求"
            maxlength="50"
            show-count
          />
        </n-form-item>

        <n-form-item label="内容" path="content">
          <n-input
            v-model:value="formData.content"
            type="textarea"
            placeholder="请详细描述您的需求或可以提供的帮助..."
            :autosize="{ minRows: 6, maxRows: 12 }"
            maxlength="1000"
            show-count
          />
        </n-form-item>

        <n-form-item label="楼栋" path="buildingId">
          <n-select
            v-model:value="formData.buildingId"
            placeholder="请选择楼栋"
            :options="buildingOptions"
            clearable
            style="max-width: 320px"
          />
        </n-form-item>

        <n-form-item label="位置描述" path="locationDetail">
          <n-input
            v-model:value="formData.locationDetail"
            placeholder="如：单元号、门口等具体位置"
            maxlength="100"
          />
        </n-form-item>

        <n-form-item label="图片" path="images">
          <n-upload
            v-model:file-list="fileList"
            :max="3"
            list-type="image-card"
            :custom-request="handleUpload"
            accept="image/*"
            @before-upload="beforeUpload"
          >
            点击上传
          </n-upload>
          <div class="text-xs text-gray-400 mt-1">最多上传3张图片，单张不超过5MB</div>
        </n-form-item>

        <n-form-item label=" " :show-label="false">
          <n-space>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">
              提交发布
            </n-button>
            <n-button @click="handleCancel">取消</n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, FormInst, UploadCustomRequestOptions } from 'naive-ui'
import { createHelpWithImages } from '@/api/help'
import { getBuildingList } from '@/api/building'
import { HELP_CATEGORIES } from '@/types'
import type { Building, UploadFileInfo } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const buildingList = ref<Building[]>([])
const fileList = ref<UploadFileInfo[]>([])

const categoryOptions = computed(() =>
  HELP_CATEGORIES.map((c) => ({ label: c.label, value: c.value }))
)

const buildingOptions = computed(() =>
  buildingList.value.map((b) => ({ label: b.name, value: b.id }))
)

const formData = reactive({
  type: 'request',
  category: '',
  urgency: 'normal',
  title: '',
  content: '',
  buildingId: null as number | null,
  locationDetail: '',
})

const rules = {
  type: { required: true, message: '请选择类型', trigger: 'change' },
  category: { required: true, message: '请选择分类', trigger: 'change' },
  urgency: { required: true, message: '请选择紧急程度', trigger: 'change' },
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度为2-50个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '内容长度为10-1000个字符', trigger: 'blur' },
  ],
}

function beforeUpload(data: { file: UploadFileInfo }) {
  const file = data.file.file
  if (!file) return false
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    message.error('图片大小不能超过5MB')
    return false
  }
  return true
}

function handleUpload({ file, onFinish, onError }: UploadCustomRequestOptions) {
  onFinish()
}

async function fetchBuildings() {
  try {
    const res: any = await getBuildingList()
    buildingList.value = Array.isArray(res) ? res : res.list || res.data || []
  } catch (e: any) {
    message.error(e.message || '获取楼栋列表失败')
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  submitting.value = true
  try {
    const formDataObj = new FormData()
    formDataObj.append('type', formData.type)
    formDataObj.append('category', formData.category)
    formDataObj.append('urgency', formData.urgency)
    formDataObj.append('title', formData.title)
    formDataObj.append('content', formData.content)
    if (formData.buildingId) {
      formDataObj.append('buildingId', String(formData.buildingId))
    }
    if (formData.locationDetail) {
      formDataObj.append('locationDetail', formData.locationDetail)
    }

    const validFiles = fileList.value.filter((f) => f.file)
    for (const fileInfo of validFiles) {
      if (fileInfo.file) {
        formDataObj.append('files', fileInfo.file)
      }
    }

    const res: any = await createHelpWithImages(formDataObj)
    message.success('发布成功')
    if (res?.id) {
      router.push(`/help/${res.id}`)
    } else {
      router.push('/help')
    }
  } catch (e: any) {
    message.error(e.message || '发布失败')
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  router.back()
}

onMounted(() => {
  if (route.query.type === 'request' || route.query.type === 'offer') {
    formData.type = route.query.type as string
  }
  fetchBuildings()
})
</script>

<style scoped>
.p-6 {
  padding: 24px;
}
.mt-1 {
  margin-top: 4px;
}
.max-w-3xl {
  max-width: 48rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.text-xs {
  font-size: 12px;
}
.text-gray-400 {
  color: #9ca3af;
}
</style>
