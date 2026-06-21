import request from '@/utils/request'

export interface CreateAnnouncementParams {
  title: string
  content: string
  type?: string
  isTop?: boolean
}

export function getAnnouncementList() {
  return request.get('/announcement/list')
}

export function getAnnouncementDetail(id: number) {
  return request.get(`/announcement/${id}`)
}

export function createAnnouncement(params: CreateAnnouncementParams) {
  return request.post('/announcement', params)
}

export function updateAnnouncement(id: number, params: Partial<CreateAnnouncementParams>) {
  return request.put(`/announcement/${id}`, params)
}

export function deleteAnnouncement(id: number) {
  return request.delete(`/announcement/${id}`)
}
