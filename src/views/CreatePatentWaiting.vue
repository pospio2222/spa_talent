<template>
  <div class="waiting-container">
    <div class="waiting-card">
      <div class="waiting-icon">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      
      <h2 class="waiting-title">AI is processing your request</h2>
      
      <p class="waiting-message">
        The AI system is currently:
      </p>
      
      <div class="status-list">
        <div class="status-item">
          <div class="status-icon">1</div>
          <div class="status-text">Reading your uploaded document</div>
        </div>
        <div class="status-item">
          <div class="status-icon">2</div>
          <div class="status-text">Understanding technical concepts</div>
        </div>
        <div class="status-item">
          <div class="status-icon">3</div>
          <div class="status-text">Drafting formal patent claims</div>
        </div>
        <div class="status-item">
          <div class="status-icon">4</div>
          <div class="status-text">Preparing your AI-assisted editing page</div>
        </div>
      </div>
      
      <p style="color: #9ca3af; font-size: 0.85rem; margin-top: 1.5rem; font-style: italic;">
        ⏳ This process may take 5–10 minutes. You can keep this page open while it runs, or return to the Create Patent page later to check your results.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import api from '@/utils/api'
import { config } from '@/config'

const router = useRouter()
const route = useRoute()
const message = useMessage()

let pollInterval: number | null = null

onMounted(() => {
  const taskId = route.params.taskId as string
  if (!taskId) {
    message.error('No task ID found. Please try uploading again.')
    router.push('/create-patent')
    return
  }
  // Check immediately, then start polling
  checkTaskStatusOnce(taskId)
  checkTaskStatus(taskId)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})

async function checkTaskStatusOnce(taskId: string) {
  try {
    const response = await api.get(`${config.patentApiUrl}/api/patent-task-status/${taskId}`)
    const data = response.data
    if (data.state === 'SUCCESS' && data.project_id) {
      message.success('Patent claims generated successfully!')
      router.push(`/edit-patent/${data.project_id}`)
    } else if (data.state === 'FAILURE') {
      showError(data.error || 'Patent claims generation failed')
    }
  } catch (error: any) {
    // Ignore errors on initial check, polling will handle it
    console.log('Initial status check failed, will continue polling:', error)
  }
}

function checkTaskStatus(taskId: string) {
  let pollCount = 0
  const maxPolls = 300 // 25 minutes max
  
  pollInterval = window.setInterval(async () => {
    if (++pollCount > maxPolls) {
      if (pollInterval) clearInterval(pollInterval)
      pollInterval = null
      showError('Processing is taking longer than expected. Please try again or contact support.')
      return
    }
    
    try {
      const response = await api.get(`${config.patentApiUrl}/api/patent-task-status/${taskId}`)
      const data = response.data
      
      if (data.state === 'SUCCESS' && data.project_id) {
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
        message.success('Patent claims generated successfully!')
        router.push(`/edit-patent/${data.project_id}`)
      } else if (data.state === 'FAILURE') {
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
        showError(data.error || 'Patent claims generation failed')
      }
      // If state is PENDING or PROCESSING, continue polling
    } catch (error: any) {
      // Don't stop polling on network errors, just log and continue
      console.warn('Error checking status, will retry:', error.message)
    }
  }, 5000)
}

function showError(errorMessage: string) {
  message.error(errorMessage)
  setTimeout(() => {
    router.push('/create-patent')
  }, 3000)
}
</script>

<style scoped>
.waiting-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.waiting-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%);
  border-radius: 16px;
  padding: 3rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.waiting-icon {
  font-size: 4rem;
  color: #3b82f6;
  margin-bottom: 1.5rem;
}

.waiting-title {
  color: #1e40af;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.waiting-message {
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.status-list {
  text-align: left;
  margin-top: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
}

.status-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.status-text {
  color: #374151;
  font-size: 0.9rem;
}
</style>

