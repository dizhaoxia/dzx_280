<template>
  <div class="h-full overflow-auto bg-gray-50">
    <div class="max-w-2xl mx-auto p-6">
      <div class="mb-6 flex items-center gap-3">
        <n-button text @click="router.back()">
          <template #icon>
            <n-icon><MdArrowBack /></n-icon>
          </template>
        </n-button>
        <div>
          <h2 class="text-2xl font-bold text-gray-800">登记物品</h2>
          <p class="text-sm text-gray-500 mt-1">分享您的闲置物品给邻居使用</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100px">
          <n-form-item label="物品名称" path="name">
            <n-input v-model:value="formData.name" placeholder="请输入物品名称" maxlength="50" show-count />
          </n-form-item>

          <n-form-item label="物品描述" path="description">
            <n-input
              v-model:value="formData.description"
              type="textarea"
              placeholder="请描述物品的功能、使用注意事项等"
              :autosize="{ minRows: 3, maxRows: 6 }"
              maxlength="500"
              show-count
            />
          </n-form-item>

          <n-form-item label="物品照片" path="photos">
            <div>
              <n-upload
                :show-file-list="false"
                :custom-request="handleUpload"
                accept="image/*"
                multiple
                class="mb-2"
              >
                <div class="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#18a058] hover:bg-green-50 transition-colors">
                  <n-icon size="28" class="text-gray-400"><MdAdd /></n-icon>
                  <span class="text-xs text-gray-500 mt-1">上传照片</span>
                </div>
              </n-upload>
              <div class="flex flex-wrap gap-2 mt-2">
                <div
                  v-for="(photo, index) in photoList"
                  :key="index"
                  class="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img :src="photo" class="w-full h-full object-cover" />
                  <n-button
                    text
                    type="error"
                    size="small"
                    class="absolute top-0 right-0 !p-1 !min-w-0 !w-6 !h-6"
                    @click="removePhoto(index)"
                  >
                    <template #icon>
                      <n-icon size="14"><MdClose /></n-icon>
                    </template>
                  </n-button>
                </div>
              </div>
              <p class="text-xs text-gray-400 mt-2">最多上传9张图片，支持点击查看大图</p>
            </div>
          </n-form-item>

          <n-form-item label="新旧程度" path="condition">
            <n-radio-group v-model:value="formData.condition">
              <n-space>
                <n-radio v-for="opt in ITEM_CONDITION_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>

          <n-form-item label="押金设置" path="deposit">
            <div class="w-full">
              <n-space vertical size="medium" style="width: 100%">
                <n-space>
                  <n-checkbox v-model:checked="formData.isFreeDeposit">免押金</n-checkbox>
                </n-space>
                <n-input-number
                  v-model:value="formData.deposit"
                  :min="0"
                  :max="10000"
                  placeholder="请输入押金金额"
                  :disabled="formData.isFreeDeposit"
                  style="width: 240px"
                >
                  <template #prefix>¥</template>
                </n-input-number>
              </n-space>
            </div>
          </n-form-item>

          <n-form-item label="可借时段" path="availableSlots">
            <n-input
              v-model:value="formData.availableSlots"
              type="textarea"
              placeholder="例如：工作日晚上6点后、周末全天"
              :autosize="{ minRows: 2, maxRows: 4 }"
              maxlength="200"
              show-count
            />
          </n-form-item>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <n-button @click="router.back()">取消</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">
              {{ isEdit ? '保存修改' : '提交登记' }}
            </n-button>
          </div>
        </n-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, type FormInst, type FormRules, type UploadCustomRequestOptions } from 'naive-ui'
import { MdArrowBack, MdAdd, MdClose } from '@vicons/ionicons4'
import { createItem, updateItem, uploadItemPhoto, getItemDetail } from '@/api/borrow'
import { ITEM_CONDITION_OPTIONS } from '@/types'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const photoList = ref<string[]>([])

const editId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => !!editId.value)

const formData = reactive({
  name: '',
  description: '',
  photos: '',
  condition: 'good' as string,
  deposit: 0 as number | null,
  isFreeDeposit: true,
  availableSlots: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入物品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度2-50个字符', trigger: 'blur' },
  ],
}

async function handleUpload({ file, onFinish, onError }: UploadCustomRequestOptions) {
  if (photoList.value.length >= 9) {
    message.warning('最多上传9张照片')
    onError()
    return
  }

  try {
    const formData = new FormData()
    formData.append('photo', file.file as Blob)
    const res: any = await uploadItemPhoto(formData)
    if (res?.url) {
      photoList.value.push(res.url)
      updatePhotosField()
    }
    onFinish()
  } catch (e: any) {
    message.error(e.message || '上传失败')
    onError()
  }
}

function removePhoto(index: number) {
  photoList.value.splice(index, 1)
  updatePhotosField()
}

function updatePhotosField() {
  formData.photos = photoList.value.length > 0 ? JSON.stringify(photoList.value) : ''
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  if (photoList.value.length === 0) {
    message.warning('请至少上传一张物品照片')
    return
  }

  try {
    submitting.value = true

    const submitData = {
      name: formData.name,
      description: formData.description,
      photos: formData.photos,
      condition: formData.condition,
      deposit: formData.isFreeDeposit ? 0 : formData.deposit || 0,
      isFreeDeposit: formData.isFreeDeposit,
      availableSlots: formData.availableSlots,
    }

    if (isEdit.value) {
      await updateItem(editId.value!, submitData)
      message.success('修改成功')
    } else {
      await createItem(submitData)
      message.success('登记成功')
    }

    setTimeout(() => {
      router.push('/borrow/manage')
    }, 500)
  } catch (e: any) {
    message.error(e.message || (isEdit.value ? '修改失败' : '登记失败'))
  } finally {
    submitting.value = false
  }
}

async function loadEditData() {
  if (!editId.value) return
  try {
    const res: any = await getItemDetail(editId.value)
    if (res) {
      formData.name = res.name || ''
      formData.description = res.description || ''
      formData.condition = res.condition || 'good'
      formData.deposit = res.deposit || 0
      formData.isFreeDeposit = res.isFreeDeposit || res.deposit === 0
      formData.availableSlots = res.availableSlots || ''

      if (res.photos) {
        try {
          photoList.value = JSON.parse(res.photos)
        } catch (e) {
          photoList.value = [res.photos]
        }
      }
    }
  } catch (e: any) {
    message.error(e.message || '加载物品信息失败')
  }
}

onMounted(() => {
  if (isEdit.value) {
    loadEditData()
  }
})
</script>
