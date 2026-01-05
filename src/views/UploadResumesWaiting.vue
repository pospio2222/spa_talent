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

      <!-- File Status List -->
      <div class="file-status-list" v-if="fileStatuses.length > 0">
        <div 
          v-for="(file, index) in fileStatuses" 
          :key="index" 
          class="file-status-item"
          :class="file.status"
        >
          <div class="file-status-icon">
            <i v-if="file.status === 'pending'" class="fas fa-clock"></i>
            <i v-else-if="file.status === 'processing'" class="fas fa-spinner fa-spin"></i>
            <i v-else-if="file.status === 'complete'" class="fas fa-check-circle"></i>
            <i v-else class="fas fa-exclamation-circle"></i>
          </div>
          <div class="file-status-name">{{ file.name }}</div>
          <div class="file-status-badge" :class="file.status">
            {{ file.status === 'pending' ? 'Pending' : file.status === 'processing' ? 'Processing' : file.status === 'complete' ? 'Complete' : 'Error' }}
          </div>
        </div>
      </div>

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
import { config } from '@/config'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const projectId = ref(parseInt(route.params.projectId as string))
const taskId = ref(route.params.taskId as string)
const statusMessage = ref('Processing your resume files...')
const error = ref<string | null>(null)
const pollInterval = ref<number | null>(null)

// File status tracking
interface FileStatus {
  name: string
  status: 'pending' | 'processing' | 'complete' | 'error'
}
const fileStatuses = ref<FileStatus[]>([])

onMounted(() => {
  // Load file names from sessionStorage
  const storedFiles = sessionStorage.getItem(`upload_files_${taskId.value}`)
  if (storedFiles) {
    try {
      const fileNames = JSON.parse(storedFiles)
      fileStatuses.value = fileNames.map((name: string) => ({
        name,
        status: 'pending' as const
      }))
      sessionStorage.removeItem(`upload_files_${taskId.value}`)
    } catch (e) {
      console.error('Failed to parse stored file names:', e)
    }
  }
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
      const response = await api.get(`${config.talentApiUrl}/task-status/${taskId.value}`)
      const data = response.data
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
      fileStatuses.value.forEach(file => {
        file.status = 'pending'
      })
      break
    case 'STARTED':
    case 'PROCESSING':
      statusMessage.value = 'Extracting text from resume files...'
      fileStatuses.value.forEach(file => {
        if (file.status !== 'complete') {
          file.status = 'processing'
        }
      })
      break
    case 'SUCCESS':
      statusMessage.value = 'Resumes processed successfully!'
      fileStatuses.value.forEach(file => {
        file.status = 'complete'
      })
      if (pollInterval.value) {
        clearInterval(pollInterval.value)
      }
      message.success('Resumes uploaded successfully')
      setTimeout(() => {
        router.push(`/project-analysis/${projectId.value}`)
      }, 1500)
      break
    case 'FAILURE':
    case 'ERROR':
      statusMessage.value = 'Resume processing failed.'
      const errorMsg = data.error || 'An unknown error occurred during resume processing.'
      error.value = errorMsg
      fileStatuses.value.forEach(file => {
        file.status = 'error'
      })
      if (pollInterval.value) {
        clearInterval(pollInterval.value)
      }
      message.error(errorMsg)
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

.file-status-list {
  max-width: 600px;
  width: 100%;
  margin-top: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.file-status-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.05);
  border-left: 4px solid #94a3b8;
  transition: all 0.3s ease;
}

.file-status-item:last-child {
  margin-bottom: 0;
}

.file-status-item.pending {
  border-left-color: #94a3b8;
}

.file-status-item.processing {
  border-left-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.file-status-item.complete {
  border-left-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.file-status-item.error {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.file-status-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

.file-status-icon .fa-clock {
  color: #94a3b8;
}

.file-status-icon .fa-spinner {
  color: #3b82f6;
}

.file-status-icon .fa-check-circle {
  color: #10b981;
}

.file-status-icon .fa-exclamation-circle {
  color: #ef4444;
}

.file-status-name {
  flex: 1;
  color: #1e293b;
  font-weight: 500;
  word-break: break-word;
}

.file-status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.file-status-badge.pending {
  background: #e2e8f0;
  color: #64748b;
}

.file-status-badge.processing {
  background: #dbeafe;
  color: #1e40af;
}

.file-status-badge.complete {
  background: #d1fae5;
  color: #065f46;
}

.file-status-badge.error {
  background: #fee2e2;
  color: #991b1b;
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
  
  .file-status-list {
    padding: 1rem;
  }
  
  .file-status-item {
    flex-wrap: wrap;
  }
  
  .file-status-name {
    width: 100%;
    margin-bottom: 0.25rem;
  }
  
  .actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>

