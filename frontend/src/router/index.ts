import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

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
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/Messages.vue'),
        meta: { title: '消息' },
      },
      {
        path: 'messages/:conversationId',
        name: 'Chat',
        component: () => import('@/views/Chat.vue'),
        meta: { title: '聊天' },
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
  } else {
    next()
  }
})

export default router
