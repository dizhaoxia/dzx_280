import request from '@/utils/request'

export function getBuildingList() {
  return request.get('/building/list')
}

export function createBuilding(data: any) {
  return request.post('/building', data)
}

export function updateBuilding(id: number, data: any) {
  return request.put(`/building/${id}`, data)
}

export function deleteBuilding(id: number) {
  return request.delete(`/building/${id}`)
}
