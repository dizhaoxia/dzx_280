<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <n-card title="登录" class="w-full max-w-md">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
      >
        <n-form-item label="手机号" path="phone">
          <n-input v-model:value="formValue.phone" placeholder="请输入手机号" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formValue.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
            @keyup.enter="handleSubmit"
          />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" block :loading="loading" @click="handleSubmit">
            登录
          </n-button>
        </n-form-item>
      </n-form>
      <div class="text-center text-sm text-gray-500">
        还没有账号？
        <router-link to="/register" class="text-green-500 hover:text-green-600">
          去注册
        </router-link>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, type FormRules, type FormInst } from 'naive-ui'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const formValue = reactive({
  phone: '',
  password: '',
})

const rules: FormRules = {
  phone: [
    {
      required: true,
      message: '请输入手机号',
      trigger: 'blur',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '手机号格式不正确',
      trigger: 'blur',
    },
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: 'blur',
    },
    {
      min: 6,
      max: 20,
      message: '密码长度为6-20位',
      trigger: 'blur',
    },
  ],
}

async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return
  } catch (e) {
    return
  }
  loading.value = true
  try {
    await userStore.handleLogin(formValue.phone, formValue.password)
    message.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (e: any) {
    console.error('登录错误:', e)
    const errMsg = e?.message || e?.data?.message || e?.response?.data?.message || '登录失败，请检查后端服务是否启动'
    message.error(errMsg)
  } finally {
    loading.value = false
  }
}
</script>
