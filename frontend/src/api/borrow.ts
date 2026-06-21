import request from '@/utils/request'

export function getBorrowStatistics() {
  return request.get('/borrow/statistics')
}

export function createItem(params: {
  name: string
  description?: string
  photos?: string
  condition?: string
  deposit?: number
  isFreeDeposit?: boolean
  availableSlots?: string
  buildingId?: number
}) {
  return request.post('/borrow/item', params)
}

export function updateItem(
  id: number,
  params: {
    name?: string
    description?: string
    photos?: string
    condition?: string
    deposit?: number
    isFreeDeposit?: boolean
    availableSlots?: string
    status?: string
  },
) {
  return request.put(`/borrow/item/${id}`, params)
}

export function deleteItem(id: number) {
  return request.delete(`/borrow/item/${id}`)
}

export function getItemDetail(id: number) {
  return request.get(`/borrow/item/${id}`)
}

export function getItems(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  ownerId?: number
  buildingId?: number
  status?: string
  condition?: string
}) {
  return request.get('/borrow/items', { params })
}

export function getMyItems(params?: {
  page?: number
  pageSize?: number
  status?: string
  condition?: string
}) {
  return request.get('/borrow/my-items', { params })
}

export function uploadItemPhoto(formData: FormData) {
  return request.post('/borrow/upload-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function createBorrowRequest(params: {
  itemId: number
  expectedStartDate: string
  expectedEndDate: string
  remark?: string
}) {
  return request.post('/borrow/request', params)
}

export function getBorrowRequestDetail(id: number) {
  return request.get(`/borrow/request/${id}`)
}

export function getMyBorrowRequests(params?: {
  page?: number
  pageSize?: number
  status?: string
  itemId?: number
}) {
  return request.get('/borrow/requests/borrower', { params })
}

export function getReceivedBorrowRequests(params?: {
  page?: number
  pageSize?: number
  status?: string
  itemId?: number
}) {
  return request.get('/borrow/requests/owner', { params })
}

export function processBorrowRequest(
  id: number,
  params: {
    status: 'approved' | 'rejected'
    rejectReason?: string
  },
) {
  return request.post(`/borrow/request/${id}/process`, params)
}

export function cancelBorrowRequest(id: number) {
  return request.post(`/borrow/request/${id}/cancel`)
}

export function getBorrowRecordDetail(id: number) {
  return request.get(`/borrow/record/${id}`)
}

export function getMyBorrowRecords(params?: {
  page?: number
  pageSize?: number
  status?: string
  itemId?: number
}) {
  return request.get('/borrow/records/borrower', { params })
}

export function getMyLentRecords(params?: {
  page?: number
  pageSize?: number
  status?: string
  itemId?: number
}) {
  return request.get('/borrow/records/owner', { params })
}

export function returnItem(
  id: number,
  params: {
    returnRemark?: string
    actualDamageCost?: number
  },
) {
  return request.post(`/borrow/record/${id}/return`, params)
}
