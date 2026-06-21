<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">公告管理</h2>
      <n-button type="primary" @click="handleAdd">
        <template #icon><n-icon><MdAdd /></n-icon></template>
        发布公告
      </n-button>
    </div>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="announcementList"
        :loading="loading"
        :pagination="false"
        :row-key="(row: any) => row.id"
      />
    </n-card>

    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="editingId ? '编辑公告' : '发布公告'"
      style="width: 640px"
    >
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="标题" path="title">
          <n-input v-model:value="formData.title" placeholder="公告标题" maxlength="100" show-count />
        </n-form-item>
        <n-form-item label="类型" path="type">
          <n-select
            v-model:value="formData.type"
            :options="[
              { label: '通知', value: 'notice' },
              { label: '公告', value: 'announcement' },
              { label: '活动', value: 'event' },
              { label: '紧急', value: 'urgent' },
            ]"
            placeholder="请选择类型"
            style="max-width: 240px"
          />
        </n-form-item>
        <n-form-item label="优先级" path="priority">
          <n-select
            v-model:value="formData.priority"
            :options="[
              { label: '普通', value: 'normal' },
              { label: '重要', value: 'important' },
              { label: '置顶', value: 'top' },
            ]"
            placeholder="请选择优先级"
            style="max-width: 240px"
          />
        </n-form-item>
        <n-form-item label="内容" path="content">
          <n-input
            v-model:value="formData.content"
            type="textarea"
            :autosize="{ minRows: 8, maxRows: 16 }"
            placeholder="请输入公告内容..."
            maxlength="5000"
            show-count
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ editingId ? '更新' : '发布' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, useDialog, FormInst } from 'naive-ui'
import { MdAdd } from '@vicons/ionicons4'
import dayjs from 'dayjs'
import {
  getAnnouncementList,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/api/announcement'

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const announcementList = ref<any[]>([])
const showModal = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInst | null>(null)

const formData = reactive({
  title: '',
  type: 'notice',
  priority: 'normal',
  content: '',
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 5, message: '内容至少5个字符', trigger: 'blur' },
  ],
}

const typeMap: Record<string, { label: string; color: string }> = {
  notice: { label: '通知', color: 'default' },
  announcement: { label: '公告', color: 'info' },
  event: { label: '活动', color: 'success' },
  urgent: { label: '紧急', color: 'error' },
}

const priorityMap: Record<string, { label: string; color: string }> = {
  normal: { label: '普通', color: 'default' },
  important: { label: '重要', color: 'warning' },
  top: { label: '置顶', color: 'error' },
}

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: '标题',
    key: 'title',
    width: 260,
    ellipsis: { tooltip: true },
    render: (row: any) => {
      const tags: any[] = []
      if (row.priority === 'top') tags.push(h('span', { class: 'mr-2 text-red-500 text-xs' }, '📌'))
      return h('span', {}, [...tags, row.title])
    },
  },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render: (row: any) => {
      const info = typeMap[row.type] || typeMap.notice
      return h('span', { class: `px-2 py-0.5 rounded text-xs bg-gray-${info.color === 'error' ? '100' : '100'} text-${info.color === 'error' ? 'red' : info.color === 'success' ? 'green' : info.color === 'info' ? 'blue' : 'gray'}-600` }, info.label)
    },
  },
  {
    title: '优先级',
    key: 'priority',
    width: 100,
    render: (row: any) => {
      const info = priorityMap[row.priority] || priorityMap.normal
      const colorClass = info.color === 'error' ? 'text-red-600 bg-red-50' : info.color === 'warning' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-600 bg-gray-100'
      return h('span', { class: `px-2 py-0.5 rounded text-xs ${colorClass}` }, info.label)
    },
  },
  {
    title: '发布时间',
    key: 'createdAt',
    width: 180,
    render: (row: any) => (row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm') : '-'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row: any) => h('div', { class: 'flex gap-2' }, [
      h(
        'button',
        {
          class: 'text-[#18a058] hover:underline text-sm',
          onClick: () => handleEdit(row),
        },
        '编辑'
      ),
      h(
        'button',
        {
          class: 'text-red-500 hover:underline text-sm',
          onClick: () => handleDelete(row),
        },
        '删除'
      ),
    ]),
  },
]

async function fetchList() {
  try {
    loading.value = true
    const res: any = await getAnnouncementList()
    announcementList.value = Array.isArray(res) ? res : res.list || res.data || []
  } catch (e: any) {
    message.error(e.message || '获取公告列表失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(formData, {
    title: '',
    type: 'notice',
    priority: 'normal',
    content: '',
  })
}

function handleAdd() {
  editingId.value = null
  resetForm()
  showModal.value = true
}

function handleEdit(row: any) {
  editingId.value = row.id
  Object.assign(formData, {
    title: row.title || '',
    type: row.type || 'notice',
    priority: row.priority || 'normal',
    content: row.content || '',
  })
  showModal.value = true
}

function handleDelete(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除公告「${row.title}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteAnnouncement(row.id)
        message.success('删除成功')
        fetchList()
      } catch (e: any) {
        message.error(e.message || '删除失败')
      }
    },
  })
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  try {
    submitting.value = true
    if (editingId.value) {
      await updateAnnouncement(editingId.value, { ...formData })
      message.success('更新成功')
    } else {
      await createAnnouncement({ ...formData })
      message.success('发布成功')
    }
    showModal.value = false
    fetchList()
  } catch (e: any) {
    message.error(e.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>
