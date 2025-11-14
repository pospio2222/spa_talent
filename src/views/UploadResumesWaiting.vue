<template>
  <div class="waiting-container">
    <PageBanner
      title="Processing Resumes"
      subtitle="Extracting text from your resume files..."
      :show-credits="false"
    />

    <div class="waiting-content">
      <div class="animation-wrapper">
        <div class="spinner"></div>
      </div>
      
      <h2 class="status-title">{{ statusMessage }}</h2>
      <p class="status-subtitle" v-if="!error">This usually takes about a few seconds for each file...</p>

      <n-alert v-if="error" type="error" title="Error" style="margin-top: 30px; max-width: 500px;">
        {{ error }}
      </n-alert>

      <div class="actions" v-if="error">
        <n-button type="primary" @click="goToAnalysis">
          Go to Project Analysis
        </n-button>
        <n-button @click="goToProjects">
          Go to Projects
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NButton, useMessage } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'
import { useAuth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { getCookie } = useAuth()

const projectId = ref(parseInt(route.params.projectId as string))
const taskId = ref(route.params.taskId as string)
const statusMessage = ref('Processing your resume files...')
const error = ref<string | null>(null)
const pollInterval = ref<number | null>(null)

const apiUrl = import.meta.env.VITE_API_URL || 'https://talent.api.4aitek.com'

onMounted(() => {
  checkTaskStatus()
})

onUnmounted(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
  }
})

function checkTaskStatus() {
  pollInterval.value = window.setInterval(async () => {
    try {
      const token = getCookie('4aitek_jwt_token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch(`${apiUrl}/task-status/${taskId.value}`, {
        credentials: 'include',
        headers: {
          'Cookie': `4aitek_jwt_token=${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to check task status')
      }

      const data = await response.json()
      updateStatus(data)
    } catch (err: any) {
      console.error('Error checking task status:', err)
      statusMessage.value = 'Error checking processing status'
      error.value = err.message || 'Failed to check task status'
      if (pollInterval.value) {
        clearInterval(pollInterval.value)
      }
    }
  }, 3000) // Check every 3 seconds
}

function updateStatus(data: any) {
  switch (data.state) {
    case 'PENDING':
      statusMessage.value = 'Initializing resume processing...'
      break
    case 'STARTED':
    case 'PROCESSING':
      statusMessage.value = 'Extracting text from resume files...'
      break
    case 'SUCCESS':
      statusMessage.value = 'Resumes processed successfully!'
      if (pollInterval.value) {
        clearInterval(pollInterval.value)
      }
      message.success('Resumes uploaded successfully')
      // Redirect to project analysis page
      setTimeout(() => {
        router.push(`/project-analysis/${projectId.value}`)
      }, 1500)
      break
    case 'FAILURE':
    case 'ERROR':
      statusMessage.value = 'Resume processing failed.'
      error.value = data.error || 'An unknown error occurred during resume processing.'
      if (pollInterval.value) {
        clearInterval(pollInterval.value)
      }
      message.error(error.value || 'Resume processing failed')
      break
  }
}

function goToAnalysis() {
  router.push(`/project-analysis/${projectId.value}`)
}

function goToProjects() {
  router.push('/projects')
}
</script>

<style scoped>
.waiting-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.waiting-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.animation-wrapper {
  margin-bottom: 2rem;
}

.spinner {
  width: 80px;
  height: 80px;
  border: 8px solid rgba(255, 255, 255, 0.2);
  border-top: 8px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-title {
  color: white;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.status-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .status-title {
    font-size: 1.5rem;
  }
  
  .status-subtitle {
    font-size: 1rem;
  }
  
  .actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>

