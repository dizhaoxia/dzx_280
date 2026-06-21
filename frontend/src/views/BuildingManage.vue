<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">楼栋管理</h2>
      <n-button type="primary" @click="handleAdd">
        <template #icon><n-icon><MdAdd /></n-icon></template>
        新增楼栋
      </n-button>
    </div>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="buildingList"
        :loading="loading"
        :pagination="false"
        :row-key="(row: any) => row.id"
      />
    </n-card>

    <n-modal
      v-model:show="showModal"
      preset="card"
      :title="editingId ? '编辑楼栋' : '新增楼栋'"
      style="width: 520px"
    >
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="100px"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="楼栋编号" path="code">
          <n-input v-model:value="formData.code" placeholder="如：1栋、A座" />
        </n-form-item>
        <n-form-item label="楼栋名称" path="name">
          <n-input v-model:value="formData.name" placeholder="如：1号楼、紫薇苑" />
        </n-form-item>
        <n-form-item label="单元数" path="unitCount">
          <n-input-number v-model:value="formData.unitCount" :min="1" :max="50" />
        </n-form-item>
        <n-form-item label="总户数" path="totalHouseholds">
          <n-input-number v-model:value="formData.totalHouseholds" :min="0" :max="2000" />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input
            v-model:value="formData.remark"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="选填"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useMessage, useDialog, FormInst } from 'naive-ui'
import { MdAdd, MdCreate, MdTrash } from '@vicons/ionicons4'
import { getBuildingList, createBuilding, updateBuilding, deleteBuilding } from '@/api/building'

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const buildingList = ref<any[]>([])
const showModal = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInst | null>(null)

const formData = reactive({
  code: '',
  name: '',
  unitCount: 1,
  totalHouseholds: 0,
  remark: '',
})

const rules = {
  code: [{ required: true, message: '请输入楼栋编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入楼栋名称', trigger: 'blur' }],
  unitCount: [{ required: true, message: '请输入单元数', trigger: 'change', type: 'number' }],
  totalHouseholds: [{ required: true, message: '请输入总户数', trigger: 'change', type: 'number' }],
}

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '楼栋编号', key: 'code', width: 140 },
  { title: '楼栋名称', key: 'name', width: 180 },
  { title: '单元数', key: 'unitCount', width: 120 },
  { title: '总户数', key: 'totalHouseholds', width: 120 },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
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
    const res: any = await getBuildingList()
    buildingList.value = Array.isArray(res) ? res : res.list || res.data || []
  } catch (e: any) {
    message.error(e.message || '获取楼栋列表失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(formData, {
    code: '',
    name: '',
    unitCount: 1,
    totalHouseholds: 0,
    remark: '',
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
    code: row.code || '',
    name: row.name || '',
    unitCount: row.unitCount || 1,
    totalHouseholds: row.totalHouseholds || 0,
    remark: row.remark || '',
  })
  showModal.value = true
}

function handleDelete(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除楼栋「${row.name || row.code}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteBuilding(row.id)
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
      await updateBuilding(editingId.value, { ...formData })
      message.success('更新成功')
    } else {
      await createBuilding({ ...formData })
      message.success('创建成功')
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
