import request from '@/utils/request'

export interface UpdateProfileParams {
  nickname?: string
  avatar?: string
}

export interface VerifyByPropertyParams {
  propertyCertNo: string
  buildingId: number
  roomNo: string
}

export function updateProfile(params: UpdateProfileParams) {
  return request.put('/user/profile', params)
}

export function getProfile() {
  return request.get('/user/profile')
}

export function verifyByIdCard(formData: FormData) {
  return request.post('/user/verify/idcard', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function verifyByProperty(params: VerifyByPropertyParams) {
  return request.post('/user/verify/property', params)
}

export function getUserInfo(id: number) {
  return request.get(`/user/${id}`)
}
