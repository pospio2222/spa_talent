<template>
  <div class="waiting-container">
    <PageBanner
      title="Creating Project"
      subtitle="Your recruiting project is being set up"
      :show-credits="false"
    />

    <div class="waiting-content">
      <div class="animation-wrapper">
        <div class="spinner"></div>
      </div>
      
      <h2 class="status-title">{{ statusMessage }}</h2>
      <p class="status-subtitle" v-if="!error">This may take a few moments...</p>

      <n-alert v-if="error" type="error" title="Error" style="margin-top: 30px; max-width: 500px;">
        {{ error }}
      </n-alert>

      <div class="actions" v-if="error">
        <n-button type="primary" @click="retryTask" :loading="isRetrying">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
          Retry
        </n-button>
        <n-button @click="router.push('/projects')">
          Go to Projects
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NAlert, NIcon, useMessage } from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import PageBanner from '@/components/PageBanner.vue'
import { config } from '@/config'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const taskId = ref<string | null>(null)
const statusMessage = ref('Starting project creation...')
const error = ref<string | null>(null)
const isRetrying = ref(false)
let pollInterval: number | null = null

async function checkTaskStatusOnce(id: string) {
  try {
    const response = await api.get(`${config.talentApiUrl}/task-status/${id}`)
    const data = response.data
    updateStatus(data)
  } catch (err: any) {
    console.error('Initial status check failed:', err)
  }
}

function checkTaskStatus(id: string) {
  let pollCount = 0
  const maxPolls = 300 // 25 minutes max

  pollInterval = window.setInterval(async () => {
    if (++pollCount > maxPolls) {
      if (pollInterval) clearInterval(pollInterval)
      pollInterval = null
      error.value = 'Processing is taking longer than expected. Please try again or contact support.'
      statusMessage.value = 'Project creation timed out.'
      return
    }

    try {
      const response = await api.get(`${config.talentApiUrl}/task-status/${id}`)
      const data = response.data
      updateStatus(data)

      if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
      }
    } catch (err: any) {
      console.warn('Error checking status, will retry:', err.message)
    }
  }, 5000)
}

function updateStatus(data: any) {
  switch (data.state) {
    case 'PENDING':
      statusMessage.value = 'Project creation is pending...'
      break
    case 'PROCESSING':
      statusMessage.value = 'Processing job description and cultural fit documents...'
      break
    case 'SUCCESS':
      statusMessage.value = 'Project created successfully!'
      message.success('Project created successfully!')
      router.push('/projects')
      break
    case 'FAILURE':
      statusMessage.value = 'Project creation failed.'
      error.value = data.error || 'An unknown error occurred during project creation.'
      message.error(error.value || 'Project creation failed')
      break
    default:
      statusMessage.value = 'Unknown status.'
      error.value = data.error || 'An unknown error occurred.'
      break
  }
}

async function retryTask() {
  if (!taskId.value) return
  isRetrying.value = true
  error.value = null
  statusMessage.value = 'Retrying project creation...'
  router.go(0)
}

onMounted(() => {
  taskId.value = route.params.taskId as string
  if (!taskId.value) {
    message.error('No task ID found. Redirecting to project creation.')
    router.push('/create-project')
    return
  }
  checkTaskStatusOnce(taskId.value)
  checkTaskStatus(taskId.value)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<style scoped>
.waiting-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.waiting-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.animation-wrapper {
  margin-bottom: 40px;
}

.spinner {
  width: 80px;
  height: 80px;
  border: 6px solid #e2e8f0;
  border-top: 6px solid #4A90E2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.status-subtitle {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 20px;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
  justify-content: center;
}
</style>
