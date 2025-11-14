<template>
  <div class="analysis-container">
    <PageBanner
      :title="`Run Project Analysis`"
      :subtitle="`Analyze resumes for project: ${project?.project_name || ''}`"
      :show-credits="false"
    />

    <div class="content-wrapper">
      <!-- Summary Stats -->
      <div v-if="showStats" class="summary-stats">
        <div class="stat-card">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">Total Resumes</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.completed }}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.pending }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.error }}</div>
          <div class="stat-label">Errors</div>
        </div>
      </div>

      <!-- Project Info Card -->
      <n-card v-if="project" class="project-info-card">
        <div class="project-info-content">
          <div class="project-info">
            <p><strong>Project:</strong> {{ project.project_name }}</p>
            <p><strong>Company:</strong> {{ project.company }}</p>
            <p><strong>Position:</strong> {{ project.position_title }}</p>
            <p><strong>Category:</strong> {{ project.position_category }}</p>
          </div>
          <n-button @click="goBack" class="back-btn" ghost>
            <template #icon>
              <n-icon><ArrowBackOutline /></n-icon>
            </template>
            Back to Projects
          </n-button>
        </div>
      </n-card>

      <!-- Progress Section -->
      <n-card class="progress-card">
        <template #header>
          <div class="card-header-content">
            <div class="control-group">
              <n-button
                type="primary"
                size="large"
                :loading="isAnalysisRunning"
                :disabled="isAnalysisRunning || resumes.length === 0"
                @click="startAnalysis"
                class="start-btn"
              >
                <template #icon>
                  <n-icon><PlayCircleOutline /></n-icon>
                </template>
                {{ isAnalysisRunning ? 'Analyzing...' : 'Start Analysis' }}
              </n-button>

              <div class="toggle-group">
                <n-switch v-model:value="overrideExisting" />
                <span class="toggle-label">Override existing analysis</span>
              </div>
            </div>
          </div>
        </template>

        <n-spin :show="isLoading">
          <div v-if="resumes.length === 0 && !isLoading" class="no-resumes">
            <n-icon size="48" color="#bdbdbd"><FolderOpenOutline /></n-icon>
            <h3>No Resumes Found</h3>
            <p>Upload resumes to this project first before running analysis.</p>
            <n-button type="primary" @click="goToUpload">Upload Resumes</n-button>
          </div>

          <table v-else class="progress-table">
            <thead>
              <tr>
                <th>Resume</th>
                <th>Status</th>
                <th>Score</th>
                <th>Results</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="resume in resumes" :key="resume.resume_id">
                <td>{{ resume.filename }}</td>
                <td>
                  <span :class="['status', getStatusClass(resume.analysis_status)]">
                    <span v-if="resume.analysis_status === 'processing'" class="spinner"></span>
                    {{ formatStatus(resume.analysis_status) }}
                  </span>
                </td>
                <td>
                  {{ resume.analysis_score !== null && resume.analysis_score !== undefined 
                     ? resume.analysis_score + '/100' : '-' }}
                </td>
                <td>
                  <n-button
                    v-if="resume.analysis_status === 'completed'"
                    type="success"
                    size="small"
                    @click="viewResults(resume.resume_id, resume.analysis_id)"
                  >
                    View
                  </n-button>
                  <n-button
                    v-else-if="resume.analysis_status === 'error'"
                    type="info"
                    size="small"
                    @click="showErrorDetails(resume.resume_id)"
                  >
                    <template #icon>
                      <n-icon><InformationCircleOutline /></n-icon>
                    </template>
                    Details
                  </n-button>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </n-spin>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NSpin, NSwitch, NIcon, useMessage } from 'naive-ui'
import { PlayCircleOutline, FolderOpenOutline, InformationCircleOutline, ArrowBackOutline } from '@vicons/ionicons5'
import PageBanner from '@/components/PageBanner.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

interface Resume {
  resume_id: number
  filename: string
  analysis_status: string | null
  analysis_score: number | null
  analysis_id: number | null
  last_analyzed: string | null
  taskId?: string
  error?: string
}

interface Project {
  project_id: number
  project_name: string
  company: string
  position_title: string
  position_category: string
}

const projectId = computed(() => route.params.projectId as string)

const resumes = ref<Resume[]>([])
const project = ref<Project | null>(null)
const isLoading = ref(false)
const isAnalysisRunning = ref(false)
const overrideExisting = ref(false)
const pollIntervals = ref<Map<number, number>>(new Map())

const stats = computed(() => {
  const total = resumes.value.length
  const completed = resumes.value.filter(r => r.analysis_status === 'completed').length
  const pending = resumes.value.filter(r => !r.analysis_status || r.analysis_status === 'pending' || r.analysis_status === 'processing').length
  const error = resumes.value.filter(r => r.analysis_status === 'error').length
  
  return { total, completed, pending, error }
})

const showStats = computed(() => {
  return stats.value.completed > 0 || stats.value.pending > 0 || stats.value.error > 0
})

function getStatusClass(status: string | null): string {
  if (status === 'completed') return 'completed'
  if (status === 'error') return 'error'
  return ''
}

function formatStatus(status: string | null): string {
  if (!status) return 'Pending'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

async function loadResumes() {
  isLoading.value = true
  try {
    const response = await fetch(`https://talent.api.4aitek.com/projects/${projectId.value}/resumes`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to load resumes: ${response.status}`)
    }

    const data = await response.json()
    if (data.success) {
      resumes.value = data.resumes
      project.value = data.project
      
      // Check for existing processing jobs
      const hasProcessing = resumes.value.some(r => r.analysis_status === 'processing')
      if (hasProcessing) {
        console.log('Detected processing jobs, starting polling...')
        startPollingForExistingJobs()
      }
    }
  } catch (error: any) {
    console.error('Error loading resumes:', error)
    message.error(error.message || 'Failed to load resumes')
  } finally {
    isLoading.value = false
  }
}

async function startAnalysis() {
  if (isAnalysisRunning.value || resumes.value.length === 0) return
  
  isAnalysisRunning.value = true
  
  // Reset status for resumes that aren't completed (unless override is true)
  if (!overrideExisting.value) {
    resumes.value.forEach(resume => {
      if (resume.analysis_status !== 'completed') {
        resume.analysis_status = 'pending'
      }
    })
  } else {
    resumes.value.forEach(resume => {
      resume.analysis_status = 'pending'
    })
  }
  
  // Start processing all resumes with 1 second delay between submissions
  for (let i = 0; i < resumes.value.length; i++) {
    setTimeout(() => {
      if (isAnalysisRunning.value) {
        processResume(resumes.value[i])
      }
    }, i * 1000) // 1 second delay
  }
}

async function processResume(resume: Resume) {
  if (!isAnalysisRunning.value) return
  
  // Check for existing analysis first (unless override is enabled)
  if (!overrideExisting.value) {
    try {
      const checkResponse = await fetch(
        `https://talent.api.4aitek.com/projects/${projectId.value}/resumes/${resume.resume_id}/check-existing`,
        { credentials: 'include' }
      )
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json()
        if (checkData.exists) {
          // Use existing results
          updateResumeStatus(resume.resume_id, 'completed', {
            score: checkData.score,
            analysis_id: checkData.analysis_id
          })
          checkAllCompleted()
          return
        }
      }
    } catch (error) {
      console.error('Error checking existing analysis:', error)
    }
  }
  
  // Run new analysis
  runAnalysis(resume)
}

async function runAnalysis(resume: Resume) {
  // Update status to processing
  updateResumeStatus(resume.resume_id, 'processing')
  
  try {
    const response = await fetch(
      `https://talent.api.4aitek.com/projects/${projectId.value}/resumes/${resume.resume_id}/analyze`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ override: overrideExisting.value })
      }
    )
    
    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.success) {
      if (data.task_id) {
        // Start polling for task completion
        startTaskPolling(resume.resume_id, data.task_id)
      } else if (data.cached) {
        // Cached result - display immediately
        updateResumeStatus(resume.resume_id, 'completed', {
          score: data.score,
          analysis_id: data.analysis_id
        })
        checkAllCompleted()
      }
    } else {
      const isQuota = String(data.error || '').toLowerCase().includes('quota') ||
                      String(data.error || '').toLowerCase().includes('credits')
      updateResumeStatus(resume.resume_id, 'error', {
        error: data.error || 'Analysis failed'
      })
      if (isQuota) {
        message.warning('Insufficient credits to complete analysis')
      }
      checkAllCompleted()
    }
  } catch (error: any) {
    console.error('Error running analysis:', error)
    updateResumeStatus(resume.resume_id, 'error', {
      error: error.message || 'Analysis failed'
    })
    checkAllCompleted()
  }
}

function startTaskPolling(resumeId: number, taskId: string) {
  const pollInterval = window.setInterval(async () => {
    try {
      const response = await fetch(
        `https://talent.api.4aitek.com/task-status/${taskId}`,
        { credentials: 'include' }
      )
      
      if (!response.ok) {
        console.warn('Status check failed, will retry:', response.status)
        return
      }
      
      const data = await response.json()
      
      if (data.state === 'SUCCESS') {
        clearInterval(pollInterval)
        pollIntervals.value.delete(resumeId)
        
        const result = data.result
        updateResumeStatus(resumeId, 'completed', {
          score: result.score,
          analysis_id: result.analysis_id
        })
        checkAllCompleted()
      } else if (data.state === 'FAILURE' || data.state === 'ERROR') {
        clearInterval(pollInterval)
        pollIntervals.value.delete(resumeId)
        
        const isQuota = String(data.error || '').toLowerCase().includes('quota') ||
                        String(data.error || '').toLowerCase().includes('credits')
        updateResumeStatus(resumeId, 'error', {
          error: data.error || 'Analysis failed'
        })
        if (isQuota) {
          message.warning('Insufficient credits')
        }
        checkAllCompleted()
      }
    } catch (error: any) {
      console.warn('Error checking task status:', error)
    }
  }, 5000) // Poll every 5 seconds
  
  pollIntervals.value.set(resumeId, pollInterval)
}

function startPollingForExistingJobs() {
  const pollInterval = window.setInterval(async () => {
    const hasProcessing = resumes.value.some(r => r.analysis_status === 'processing')
    
    if (!hasProcessing) {
      console.log('No more processing jobs, stopping polling')
      clearInterval(pollInterval)
      return
    }
    
    try {
      const response = await fetch(
        `https://talent.api.4aitek.com/projects/${projectId.value}/check-processing-jobs`,
        { credentials: 'include' }
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.resumes) {
          // Update resume statuses
          data.resumes.forEach((serverResume: any) => {
            const localResume = resumes.value.find(r => r.resume_id === serverResume.resume_id)
            if (localResume && localResume.analysis_status === 'processing') {
              if (serverResume.analysis_status === 'completed') {
                updateResumeStatus(localResume.resume_id, 'completed', {
                  score: serverResume.analysis_score,
                  analysis_id: serverResume.analysis_id
                })
              } else if (serverResume.analysis_status === 'error') {
                updateResumeStatus(localResume.resume_id, 'error', {
                  error: 'Analysis failed'
                })
              }
            }
          })
        }
      }
    } catch (error) {
      console.error('Error checking processing jobs:', error)
    }
  }, 5000) // Poll every 5 seconds
}

function updateResumeStatus(resumeId: number, status: string, data: any = {}) {
  const resume = resumes.value.find(r => r.resume_id === resumeId)
  if (!resume) return
  
  resume.analysis_status = status
  if (data.score !== undefined) resume.analysis_score = data.score
  if (data.analysis_id !== undefined) resume.analysis_id = data.analysis_id
  if (data.error !== undefined) resume.error = data.error
}

function checkAllCompleted() {
  const allDone = resumes.value.every(r => 
    r.analysis_status === 'completed' || r.analysis_status === 'error'
  )
  
  if (allDone) {
    isAnalysisRunning.value = false
    
    const completedCount = stats.value.completed
    const errorCount = stats.value.error
    
    if (completedCount > 0) {
      message.success(`Analysis completed! ${completedCount} resumes analyzed successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}.`)
    } else if (errorCount > 0) {
      message.error('Analysis failed for all resumes. Please check the errors and try again.')
    }
  }
}

function viewResults(_resumeId: number, analysisId: number | null) {
  if (!analysisId) {
    message.error('Analysis ID not found')
    return
  }
  
  // Navigate to analysis detail page
  router.push(`/analysis/${analysisId}`)
}

function showErrorDetails(resumeId: number) {
  const resume = resumes.value.find(r => r.resume_id === resumeId)
  if (!resume || !resume.error) {
    message.warning('No error details available for this resume')
    return
  }
  
  message.error(resume.error)
}

function goToUpload() {
  router.push(`/upload-resumes/${projectId.value}`)
}

function goBack() {
  router.push('/projects')
}

onMounted(() => {
  loadResumes()
})

onUnmounted(() => {
  // Clear all polling intervals
  pollIntervals.value.forEach(interval => clearInterval(interval))
  pollIntervals.value.clear()
})
</script>

<style scoped>
.analysis-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  border-left: 3px solid #667eea;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 1.4em;
  font-weight: bold;
  color: #667eea;
  display: block;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 0.8em;
  color: #666;
  margin-top: 2px;
}

.project-info-card {
  margin-bottom: 20px;
}

.project-info-content {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.project-info {
  flex: 1;
}

.project-info p {
  margin: 8px 0;
  color: #333;
}

.back-btn {
  flex-shrink: 0;
  color: #666 !important;
  border-color: #999 !important;
}

.back-btn:hover {
  color: #333 !important;
  border-color: #666 !important;
  background-color: #f5f5f5 !important;
}

.progress-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.start-btn {
  font-size: 1.1em;
  font-weight: 600;
  padding: 12px 28px;
  min-width: 180px;
}

.toggle-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.progress-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.progress-table th,
.progress-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
  line-height: 1.4;
}

.progress-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.progress-table tr:hover {
  background: #f8f9fa;
}

.status {
  font-weight: 600;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status.completed {
  color: #28a745;
}

.status.error {
  color: #dc3545;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-resumes {
  text-align: center;
  padding: 60px 20px;
  color: #757575;
}

.no-resumes .n-icon {
  margin-bottom: 20px;
}

.no-resumes h3 {
  font-size: 1.5rem;
  color: #424242;
  margin-bottom: 10px;
}

.no-resumes p {
  font-size: 1rem;
  margin-bottom: 20px;
}
</style>
