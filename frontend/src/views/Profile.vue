<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <n-card>
      <div class="flex items-center gap-6">
        <n-avatar round :size="80" :src="userStore.user?.avatar">
          {{ userStore.user?.nickname?.charAt(0) || userStore.user?.phone?.slice(-4) }}
        </n-avatar>
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h2 class="text-xl font-semibold m-0">
              {{ userStore.user?.nickname || '未设置昵称' }}
            </h2>
            <n-tag :type="statusTagType" size="small">
              {{ statusText }}
            </n-tag>
          </div>
          <p class="text-gray-500 text-sm mb-2">{{ userStore.user?.phone }}</p>
          <p class="text-sm">
            <span class="text-gray-500">积分：</span>
            <span class="text-green-600 font-medium">{{ userStore.user?.points || 0 }}</span>
          </p>
        </div>
      </div>
    </n-card>

    <n-card title="基本信息">
      <n-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="profileRules"
        label-placement="top"
      >
        <n-form-item label="头像" path="avatar">
          <div class="flex items-center gap-4">
            <n-avatar round :size="64" :src="profileForm.avatar">
              {{ profileForm.nickname?.charAt(0) || userStore.user?.phone?.slice(-4) }}
            </n-avatar>
            <n-upload
              v-model:file-list="avatarFileList"
              :max="1"
              :show-file-list="false"
              accept="image/*"
              :custom-request="handleAvatarUpload"
            >
              <n-button>上传头像</n-button>
            </n-upload>
          </div>
        </n-form-item>
        <n-form-item label="昵称" path="nickname">
          <n-input v-model:value="profileForm.nickname" placeholder="请输入昵称" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="saving" @click="saveProfile">
            保存
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <n-card title="房屋信息">
      <div class="space-y-2 text-sm">
        <div class="flex">
          <span class="text-gray-500 w-20">楼栋：</span>
          <span>{{ userStore.user?.building?.name || '未绑定' }}</span>
        </div>
        <div class="flex">
          <span class="text-gray-500 w-20">房号：</span>
          <span>{{ userStore.user?.roomNo || '未绑定' }}</span>
        </div>
      </div>
    </n-card>

    <n-card title="快捷入口">
      <div class="grid grid-cols-3 gap-4">
        <n-button block @click="goVerify">
        
          实名认证
        </n-button>
        <n-button block @click="goMyPosts">
          <template #icon><n-icon><MdListBox /></n-icon></template>
          我的发布
        </n-button>
        <n-button block type="error" @click="handleLogout">
         
          退出登录
        </n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, type FormRules, type FormInst, type UploadFileInfo } from 'naive-ui'
import {  MdListBox } from '@vicons/ionicons4'
import { useUserStore } from '@/stores/user'
import { updateProfile } from '@/api/user'
import { VERIFY_STATUS } from '@/types'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const profileFormRef = ref<FormInst | null>(null)
const saving = ref(false)
const avatarFileList = ref<UploadFileInfo[]>([])

const profileForm = reactive({
  nickname: '',
  avatar: '',
})

const profileRules: FormRules = {
  nickname: [
    {
      required: true,
      message: '请输入昵称',
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

function handleAvatarUpload({ file, onFinish, onError }: any) {
  const reader = new FileReader()
  reader.onload = (e) => {
    profileForm.avatar = e.target?.result as string
    onFinish()
  }
  reader.onerror = () => onError()
  reader.readAsDataURL(file.file)
}

async function saveProfile() {
  try {
    await profileFormRef.value?.validate()
  } catch (e) {
    return
  }
  saving.value = true
  try {
    await updateProfile({
      nickname: profileForm.nickname,
      avatar: profileForm.avatar,
    })
    userStore.updateUser({
      nickname: profileForm.nickname,
      avatar: profileForm.avatar,
    })
    message.success('保存成功')
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function goVerify() {
  router.push('/verify')
}

function goMyPosts() {
  router.push('/help')
}

function handleLogout() {
  userStore.logout()
  message.success('已退出登录')
  router.push('/login')
}

onMounted(() => {
  profileForm.nickname = userStore.user?.nickname || ''
  profileForm.avatar = userStore.user?.avatar || ''
})
</script>
