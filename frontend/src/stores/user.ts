import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, getProfile } from '@/api/auth'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  async function handleLogin(phone: string, password: string) {
    const res: any = await login({ phone, password })
    token.value = res.accessToken
    user.value = res.user
    return res
  }

  async function handleRegister(phone: string, password: string, nickname?: string) {
    const res: any = await register({ phone, password, nickname })
    token.value = res.accessToken
    user.value = res.user
    return res
  }

  async function fetchProfile() {
    const res: any = await getProfile()
    user.value = res
    return res
  }

  function updateUser(data: Partial<User>) {
    if (user.value) {
      user.value = { ...user.value, ...data }
    }
  }

  function updateUnreadCount(count: number) {
    if (user.value) {
      user.value.unreadCount = count
    }
  }

  function logout() {
    token.value = ''
    user.value = null
  }

  return {
    token,
    user,
    isLoggedIn,
    handleLogin,
    handleRegister,
    fetchProfile,
    updateUser,
    updateUnreadCount,
    logout,
  }
}, {
  persist: {
    key: 'neighborhood-user',
    paths: ['token', 'user'],
  },
})
