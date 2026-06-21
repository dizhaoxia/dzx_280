import request from '@/utils/request'

export interface LoginParams {
  phone: string
  password: string
}

export interface RegisterParams {
  phone: string
  password: string
  nickname?: string
}

export function login(params: LoginParams) {
  return request.post('/auth/login', params)
}

export function register(params: RegisterParams) {
  return request.post('/auth/register', params)
}

export function getProfile() {
  return request.get('/auth/profile')
}
