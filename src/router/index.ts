import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import DashboardLayout from '@/components/DashboardLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/console'
  },
  {
    path: '/console',
    component: DashboardLayout,
    children: [
      {
        path: '',
        name: 'console',
        component: () => import('@/views/Console.vue')
      },
      {
        path: '/projects',
        name: 'projects',
        component: () => import('@/views/Projects.vue')
      },
      {
        path: '/candidates',
        name: 'candidates',
        component: () => import('@/views/Candidates.vue')
      },
      {
        path: '/upload',
        name: 'upload',
        component: () => import('@/views/UploadResumes.vue')
      },
      {
        path: '/ai-assistant',
        name: 'ai-assistant',
        component: () => import('@/views/AIAssistant.vue')
      },
      {
        path: '/customize-ai',
        name: 'customize-ai',
        component: () => import('@/views/CustomizeAI.vue')
      }
    ]
  },
  {
    path: '/project/:projectId/candidates',
    name: 'project-candidates',
    component: () => import('@/views/ProjectCandidates.vue')
  },
  {
    path: '/candidate/:resumeId/:projectId',
    name: 'candidate-detail',
    component: () => import('@/views/CandidateDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
