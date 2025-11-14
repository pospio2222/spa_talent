<template>
  <div class="waiting-container">
    <PageBanner
      title="Creating Project"
      subtitle="Processing job description and setting up project"
    />

    <div class="content-wrapper">
      <n-card class="status-card">
        <div v-if="!hasError" class="status-content">
          <div class="spinner-container">
            <n-spin size="large" />
          </div>

          <h2>Processing Your Project</h2>
          <p>This may take a few moments. Please don't close this page.</p>

          <div class="progress-steps">
            <div class="step" :class="{ active: currentStep >= 1 }">
              <i class="fas fa-upload"></i>
              <span>Uploading Files</span>
            </div>
            <div class="step" :class="{ active: currentStep >= 2 }">
              <i class="fas fa-file-alt"></i>
              <span>Extracting Content</span>
            </div>
            <div class="step" :class="{ active: currentStep >= 3 }">
              <i class="fas fa-brain"></i>
              <span>Processing with AI</span>
            </div>
            <div class="step" :class="{ active: currentStep >= 4 }">
              <i class="fas fa-check-circle"></i>
              <span>Finalizing</span>
            </div>
          </div>
        </div>

        <div v-else class="error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <h2>Processing Failed</h2>
          <p>{{ errorMessage }}</p>
          <n-button type="primary" @click="retryOrGoBack">
            Go Back to Projects
          </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NSpin, NButton, useMessage } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const currentStep = ref(1)
const hasError = ref(false)
const errorMessage = ref('')
let pollInterval: number | null = null
let stepInterval: number | null = null

async function checkTaskStatus() {
  const taskId = route.params.taskId as string
  
  if (!taskId) {
    showError('No task ID found')
    return
  }

  try {
    const response = await fetch(`https://talent.api.4aitek.com/task-status/${taskId}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      console.warn('Status check failed, will retry:', response.status)
      return
    }

    const data = await response.json()

    if (data.state === 'SUCCESS') {
      if (pollInterval) clearInterval(pollInterval)
      if (stepInterval) clearInterval(stepInterval)
      
      const projectId = data.result?.project_id || data.project_id
      
      if (projectId) {
        message.success('Project created successfully!')
        router.push('/projects')
      } else {
        showError('Project created but ID not found')
      }
    } else if (data.state === 'FAILURE') {
      if (pollInterval) clearInterval(pollInterval)
      if (stepInterval) clearInterval(stepInterval)
      showError(data.error || 'Project creation failed')
    }
  } catch (error: any) {
    console.warn('Error checking status, will retry:', error.message)
  }
}

function showError(msg: string) {
  hasError.value = true
  errorMessage.value = msg
}

function retryOrGoBack() {
  router.push('/projects')
}

function startPolling() {
  // Initial check
  checkTaskStatus()

  // Poll every 3 seconds
  pollInterval = window.setInterval(() => {
    checkTaskStatus()
  }, 3000)

  // Animate progress steps
  stepInterval = window.setInterval(() => {
    if (currentStep.value < 4) {
      currentStep.value++
    } else {
      currentStep.value = 1
    }
  }, 2000)

  // Stop after 5 minutes
  setTimeout(() => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    if (stepInterval) {
      clearInterval(stepInterval)
      stepInterval = null
    }
    if (!hasError.value) {
      showError('Processing is taking longer than expected. Please check your projects list.')
    }
  }, 300000)
}

onMounted(() => {
  startPolling()
})

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (stepInterval) clearInterval(stepInterval)
})
</script>

<style scoped>
.waiting-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.status-card {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.status-content,
.error-content {
  padding: 2rem;
}

.spinner-container {
  margin-bottom: 2rem;
}

.status-content h2,
.error-content h2 {
  font-size: 1.5rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.status-content p,
.error-content p {
  color: #64748b;
  margin-bottom: 2rem;
}

.progress-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 2rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  background: #f8fafc;
  color: #94a3b8;
  transition: all 0.3s ease;
}

.step.active {
  background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.step i {
  font-size: 1.5rem;
}

.step span {
  font-size: 0.75rem;
  font-weight: 500;
}

.error-content {
  color: #ef4444;
}

.error-content i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-content h2 {
  color: #ef4444;
}

@media (max-width: 768px) {
  .progress-steps {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

