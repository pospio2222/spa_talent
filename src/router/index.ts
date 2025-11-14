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
    path: '/create-project',
    name: 'create-project',
    component: () => import('@/views/CreateProject.vue')
  },
  {
    path: '/create-project-waiting/:taskId',
    name: 'create-project-waiting',
    component: () => import('@/views/CreateProjectWaiting.vue')
  },
  {
    path: '/upload-resumes/:projectId',
    name: 'upload-resumes',
    component: () => import('@/views/UploadResumes.vue')
  },
  {
    path: '/upload-resumes-waiting/:projectId/:taskId',
    name: 'upload-resumes-waiting',
    component: () => import('@/views/UploadResumesWaiting.vue')
  },
  {
    path: '/project-analysis/:projectId',
    name: 'project-analysis',
    component: () => import('@/views/ProjectAnalysis.vue')
  },
  {
    path: '/project/:projectId/candidates',
    name: 'project-candidates',
    component: () => import('@/views/ProjectCandidates.vue')
  },
  {
    path: '/migrate-resumes-waiting/:projectId',
    name: 'migrate-resumes-waiting',
    component: () => import('@/views/MigrateResumesWaiting.vue')
  },
  {
    path: '/candidate/:resumeId/:projectId',
    name: 'candidate-detail',
    component: () => import('@/views/CandidateDetail.vue')
  },
  {
    path: '/analysis/:analysisId',
    name: 'analysis-detail',
    component: () => import('@/views/AnalysisDetail.vue')
  },
  {
    path: '/chatflow',
    name: 'chatflow',
    component: () => import('@/views/Chatflow.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
