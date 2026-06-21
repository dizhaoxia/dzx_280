import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMessage } from 'naive-ui'
let _msg: ReturnType<typeof useMessage> | null = null
function getMessage() {
  if (!_msg) {
    try { _msg = useMessage() } catch { _msg = null }
  }
  return _msg
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false, title: '注册' },
  },
  {
    path: '/',
    component: () => import('@/components/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'help',
        name: 'HelpList',
        component: () => import('@/views/HelpList.vue'),
        meta: { title: '互助大厅' },
      },
      {
        path: 'help/publish',
        name: 'HelpPublish',
        component: () => import('@/views/HelpPublish.vue'),
        meta: { title: '发布互助' },
      },
      {
        path: 'help/:id',
        name: 'HelpDetail',
        component: () => import('@/views/HelpDetail.vue'),
        meta: { title: '互助详情' },
      },
      {
        path: 'borrow',
        name: 'BorrowList',
        component: () => import('@/views/BorrowList.vue'),
        meta: { title: '物品借用' },
      },
      {
        path: 'borrow/publish',
        name: 'BorrowPublish',
        component: () => import('@/views/BorrowPublish.vue'),
        meta: { title: '登记物品' },
      },
      {
        path: 'borrow/:id',
        name: 'BorrowDetail',
        component: () => import('@/views/BorrowDetail.vue'),
        meta: { title: '物品详情' },
      },
      {
        path: 'borrow/manage',
        name: 'BorrowManage',
        component: () => import('@/views/BorrowManage.vue'),
        meta: { title: '借用管理' },
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/Messages.vue'),
        meta: { title: '消息' },
        children: [
          {
            path: ':conversationId',
            name: 'Chat',
            component: () => import('@/views/Chat.vue'),
            meta: { title: '聊天' },
          },
        ],
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('@/views/Announcements.vue'),
        meta: { title: '公告' },
      },
      {
        path: 'announcements/:id',
        name: 'AnnouncementDetail',
        component: () => import('@/views/AnnouncementDetail.vue'),
        meta: { title: '公告详情' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心' },
      },
      {
        path: 'verify',
        name: 'Verify',
        component: () => import('@/views/Verify.vue'),
        meta: { title: '实名认证' },
      },
      {
        path: 'admin/buildings',
        name: 'BuildingManage',
        component: () => import('@/views/BuildingManage.vue'),
        meta: { title: '楼栋管理', roles: ['property', 'admin'] },
      },
      {
        path: 'admin/announcements',
        name: 'AnnouncementManage',
        component: () => import('@/views/AnnouncementManage.vue'),
        meta: { title: '公告管理', roles: ['property', 'admin'] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  document.title = to.meta.title ? `${to.meta.title} - 社区邻里互助平台` : '社区邻里互助平台'

  if (to.meta.requiresAuth && !userStore.token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if ((to.name === 'Login' || to.name === 'Register') && userStore.token) {
    next({ name: 'Home' })
  } else if (to.meta.roles && userStore.user?.role) {
    const roles = to.meta.roles as string[]
    if (!roles.includes(userStore.user.role)) {
      next({ name: 'Home' })
      getMessage()?.error?.('权限不足')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
