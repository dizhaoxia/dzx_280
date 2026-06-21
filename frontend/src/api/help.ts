import request from '@/utils/request'

export interface CreateHelpParams {
  type: string
  title: string
  content: string
  category: string
  urgency: string
  buildingId?: number
  locationDetail?: string
  images?: string
}

export interface QueryHelpParams {
  type?: string
  category?: string
  urgency?: string
  keyword?: string
  buildingId?: number
  page?: number
  pageSize?: number
}

export function createHelp(params: CreateHelpParams) {
  return request.post('/help', params)
}

export function createHelpWithImages(formData: FormData) {
  return request.post('/help', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getHelpList(params: QueryHelpParams = {}) {
  return request.get('/help/list', { params })
}

export function getHelpDetail(id: number) {
  return request.get(`/help/${id}`)
}

export function updateHelp(id: number, params: Partial<CreateHelpParams>) {
  return request.put(`/help/${id}`, params)
}

export function deleteHelp(id: number) {
  return request.delete(`/help/${id}`)
}

export function updateHelpStatus(id: number, status: string) {
  return request.patch(`/help/${id}/status`, { status })
}
