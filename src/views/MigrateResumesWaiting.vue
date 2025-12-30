<template>
  <div class="waiting-container">
    <PageBanner
      title="Migrating Resumes"
      subtitle="Extracting candidate information from resumes"
      :show-credits="false"
    />

    <div class="waiting-content">
      <div class="animation-wrapper">
        <div class="spinner"></div>
      </div>
      
      <h2 class="status-title">{{ statusMessage }}</h2>
      <p class="status-subtitle" v-if="!error">
        Processing {{ completedCount }} of {{ totalTasks }} resumes...
      </p>

      <n-alert v-if="error" type="error" title="Error" style="margin-top: 30px; max-width: 500px;">
        {{ error }}
      </n-alert>

      <div class="actions" v-if="error">
        <n-button @click="router.push(`/project/${projectId}/candidates`)">
          Back to Candidates
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NAlert } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'
import { config } from '@/config'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => route.params.projectId as string)
const taskIds = computed(() => {
  const ids = route.query.taskIds as string
  if (!ids) return []
  return ids.split(',').filter(id => id.trim())
})

const statusMessage = ref('Starting migration...')
const error = ref<string | null>(null)
const completedCount = ref(0)
const totalTasks = computed(() => taskIds.value.length)
const completedTasks = ref<Set<string>>(new Set())
let pollInterval: number | null = null

function checkAllTasksStatus() {
  if (taskIds.value.length === 0) {
    error.value = 'No task IDs provided'
    return
  }

  let pollCount = 0
  const maxPolls = 600 // 50 minutes max (10 seconds * 600 = 100 minutes)

  pollInterval = window.setInterval(async () => {
    if (++pollCount > maxPolls) {
      if (pollInterval) clearInterval(pollInterval)
      pollInterval = null
      error.value = 'Processing is taking longer than expected. Please check back later.'
      statusMessage.value = 'Migration timed out.'
      return
    }

    try {
      // Check all tasks that aren't completed yet
      const pendingTasks = taskIds.value.filter(id => !completedTasks.value.has(id))
      
      if (pendingTasks.length === 0) {
        // All tasks completed
        if (pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
        }
        handleAllComplete()
        return
      }

      // Check each pending task
      const checkPromises = pendingTasks.map(async (taskId) => {
        try {
          const response = await api.get(`${config.talentApiUrl}/task-status/${taskId}`)
          const data = response.data
          
          if (data.state === 'SUCCESS' || data.state === 'FAILURE') {
            completedTasks.value.add(taskId)
            completedCount.value = completedTasks.value.size
            return true
          }
          
          return false
        } catch (err) {
          console.error(`Error checking task ${taskId}:`, err)
          return null
        }
      })

      await Promise.all(checkPromises)

      // Update status message
      if (completedCount.value < totalTasks.value) {
        statusMessage.value = `Processing resumes... (${completedCount.value}/${totalTasks.value} complete)`
      }

    } catch (err: any) {
      console.error('Error checking task statuses:', err)
    }
  }, 10000) // Poll every 10 seconds
}

function handleAllComplete() {
  statusMessage.value = 'Migration complete!'
  completedCount.value = totalTasks.value
  
  // Wait a moment then redirect
  setTimeout(() => {
    router.push(`/project/${projectId.value}/candidates`)
  }, 2000)
}

onMounted(() => {
  if (taskIds.value.length === 0) {
    error.value = 'No migration tasks found. Please try again.'
    return
  }

  statusMessage.value = `Starting migration of ${totalTasks.value} resumes...`
  
  // Start checking after a short delay
  setTimeout(() => {
    checkAllTasksStatus()
  }, 2000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})
</script>

<style scoped>
.waiting-container {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
}

.waiting-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.animation-wrapper {
  margin-bottom: 2rem;
}

.spinner {
  width: 80px;
  height: 80px;
  border: 6px solid rgba(59, 130, 246, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  text-align: center;
}

.status-subtitle {
  font-size: 1rem;
  color: #64748b;
  text-align: center;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
</style>

