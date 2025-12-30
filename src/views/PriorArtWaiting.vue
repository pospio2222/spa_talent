<template>
  <div class="page-container">
    <PageBanner
      title="Prior Art Analysis in Progress"
      subtitle="Processing your invention disclosure..."
      :show-credits="false"
    />

    <div class="content-wrapper">
      <div class="waiting-container">
        <div v-if="!errorMessage" class="waiting-card">
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
              <div class="status-text">Searching the USPTO patent database</div>
            </div>
            <div class="status-item">
              <div class="status-icon">4</div>
              <div class="status-text">Processing and ranking the results</div>
            </div>
            <div class="status-item">
              <div class="status-icon">5</div>
              <div class="status-text">For top result, performing detailed analysis</div>
            </div>
          </div>
          
          <p style="color: #9ca3af; font-size: 0.85rem; margin-top: 1.5rem; font-style: italic;">
            ⏳ This process may take 5–10 minutes. You can keep this page open while it runs, or return to the Prior Art Search page later to check your results.
          </p>
        </div>

        <!-- Error State -->
        <div v-else class="waiting-card">
          <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;">❌</div>
            <h2 style="color: #dc2626; margin-bottom: 1rem;">Analysis Failed</h2>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">{{ errorMessage }}</p>
            <n-button
              type="primary"
              size="large"
              @click="router.push('/prior-art')"
            >
              Try Again
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NButton, useMessage } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'
import api from '@/utils/api'
import { config } from '@/config'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const errorMessage = ref('')
let pollInterval: number | null = null
let pollCount = 0
const maxPolls = 300 // 25 minutes max (300 * 5 seconds)

async function checkTaskStatus(taskId: string) {
  try {
    const response = await api.get(`${config.patentApiUrl}/api/task-status/${taskId}`)
    const data = response.data

    if (data.state === 'SUCCESS' && data.analysis_id) {
      // Analysis complete, redirect to results
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
      message.success('Analysis complete! Redirecting to results...')
      router.push(`/prior-art-results/${data.analysis_id}`)
    } else if (data.state === 'FAILURE') {
      // Analysis failed
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
      errorMessage.value = data.error || 'Analysis failed. Please try again.'
    }
    // If PENDING or PROCESSING, keep polling
  } catch (error: any) {
    console.error('Error checking task status:', error)
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    errorMessage.value = 'Error checking status: ' + (error.message || 'Network error')
  }
}

function startPolling(taskId: string) {
  pollInterval = window.setInterval(() => {
    pollCount++
    
    if (pollCount > maxPolls) {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
      errorMessage.value = 'Analysis is taking longer than expected. Please try again or contact support.'
      return
    }
    
    checkTaskStatus(taskId)
  }, 5000) // Poll every 5 seconds
}

onMounted(() => {
  const taskId = route.params.taskId as string
  
  if (!taskId) {
    errorMessage.value = 'No task ID found. Please try uploading again.'
    return
  }

  // Start polling
  checkTaskStatus(taskId) // Check immediately
  startPolling(taskId)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  padding: 0.67rem;
  overflow-y: auto;
}

.waiting-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
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

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}
</style>

