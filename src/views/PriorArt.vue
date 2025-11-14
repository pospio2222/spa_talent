<template>
  <div class="page-container">
    <PageBanner
      title="Prior Art Search"
      subtitle="Upload your invention disclosure for AI-powered prior art analysis"
      :show-credits="false"
    />

    <div class="content-wrapper">
      <!-- Main Form Card -->
      <n-card class="content-card">
        <n-form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>
              Analysis Label
              <span class="required-badge">Required</span>
            </label>
            <input
              v-model="analysisTitle"
              type="text"
              placeholder="Enter distinguishable name for this analysis"
              class="form-input"
              required
            />
            <p class="help-text">
              This field is a label to retrieve this analysis later. Enter a short, recognizable name.
            </p>
          </div>

          <div class="upload-section">
            <h3>Invention Disclosure <span class="required-badge">Required</span></h3>
            <div 
              class="upload-area" 
              :class="{ 'dragover': isDragging }"
              @click="triggerFileInput"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <div class="upload-icon"><i class="fas fa-lightbulb"></i></div>
              <p>Click to upload invention disclosure file (PDF, DOCX, TXT, MD)</p>
              <p>or drag and drop here</p>
              <input
                ref="fileInput"
                type="file"
                class="file-input"
                accept=".pdf,.docx,.txt,.md"
                @change="handleFileSelect"
              />
            </div>
            <div v-if="selectedFile" class="file-list">
              <div class="file-item">
                <div class="file-info">
                  <span class="file-icon"><i class="fas fa-file-alt"></i></span>
                  <span>{{ selectedFile.name }}</span>
                </div>
                <button type="button" class="remove-btn" @click="removeFile">Remove</button>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <n-button
              type="primary"
              attr-type="submit"
              :loading="isSubmitting"
              :disabled="!canSubmit"
              size="large"
              class="submit-btn"
            >
              Start Prior Art Search (10 credits)
            </n-button>
          </div>
        </n-form>
      </n-card>

      <!-- Previous Analyses Table -->
      <div class="previous-analyses">
        <div class="previous-analyses-header">
          <h2>Previous Analyses</h2>
          <div class="previous-analyses-subtext">
            Showing up to 20 most recent results. Please delete older entries to keep your list organized.
          </div>
        </div>
        <div class="previous-analyses-content">
          <table v-if="analyses.length > 0" class="analyses-table">
            <thead>
              <tr>
                <th>Label</th>
                <th># Relevant Patents</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="analysis in analyses" :key="analysis.id">
                <td>{{ analysis.title }}</td>
                <td>{{ analysis.total_patents_found || 0 }}</td>
                <td>{{ formatDate(analysis.created_at) }}</td>
                <td>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <n-button
                      size="small"
                      class="btn-view"
                      @click="viewAnalysis(analysis.id)"
                    >
                      View
                    </n-button>
                    <n-button
                      size="small"
                      class="btn-delete"
                      @click="deleteAnalysis(analysis.id)"
                    >
                      <i class="fas fa-times"></i>
                    </n-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="no-analyses">
            No completed analyses found. Start your first prior art search above!
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NButton, useMessage, useDialog } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

// Form data
const analysisTitle = ref('')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isSubmitting = ref(false)

// Previous analyses
const analyses = ref<any[]>([])
const isLoadingAnalyses = ref(false)

// Computed
const canSubmit = computed(() => {
  return analysisTitle.value.trim() && selectedFile.value && !isSubmitting.value
})

// File handling
function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (file.name.startsWith('~$')) {
      message.error('Temporary files are not allowed. Please select the original file.')
      return
    }
    selectedFile.value = file
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    if (file.name.startsWith('~$')) {
      message.error('Temporary files are not allowed. Please select the original file.')
      return
    }
    selectedFile.value = file
  }
}

function removeFile() {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Submit form
async function handleSubmit() {
  if (!canSubmit.value) return

  isSubmitting.value = true

  try {
    const formData = new FormData()
    formData.append('analysis_title', analysisTitle.value.trim())
    formData.append('invention_disclosure', selectedFile.value!)

    const response = await fetch('https://patent.api.4aitek.com/prior-art-search', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    const data = await response.json()

    if (response.ok && data.success) {
      message.success('Analysis started! Redirecting to status page...')
      router.push(`/prior-art-waiting/${data.task_id}`)
    } else {
      message.error(data.detail || 'Failed to start analysis')
    }
  } catch (error: any) {
    message.error('Error starting analysis: ' + (error.message || 'Network error'))
  } finally {
    isSubmitting.value = false
  }
}

// Load previous analyses
async function loadAnalyses() {
  isLoadingAnalyses.value = true
  try {
    const response = await fetch('https://patent.api.4aitek.com/prior-art-search', {
      credentials: 'include'
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        analyses.value = data.analyses || []
      } else {
        console.warn('API returned success=false:', data)
      }
    } else {
      const errorText = await response.text()
      console.error(`Failed to load analyses: ${response.status} ${response.statusText}`, errorText)
      // Don't show error message to user, just log it
    }
  } catch (error: any) {
    console.error('Error loading analyses:', error)
    // Don't show error message to user, just log it
  } finally {
    isLoadingAnalyses.value = false
  }
}

// View analysis
function viewAnalysis(analysisId: number) {
  router.push(`/prior-art-results/${analysisId}`)
}

// Delete analysis
function deleteAnalysis(analysisId: number) {
  dialog.warning({
    title: 'Delete Analysis',
    content: 'Do you want to delete this analysis?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        const response = await fetch(`https://patent.api.4aitek.com/api/delete-analysis/${analysisId}`, {
          method: 'DELETE',
          credentials: 'include'
        })

        const data = await response.json()

        if (response.ok && data.success) {
          message.success('Analysis deleted successfully')
          analyses.value = analyses.value.filter(a => a.id !== analysisId)
        } else {
          message.error(data.message || 'Failed to delete analysis')
        }
      } catch (error: any) {
        message.error('Error deleting analysis: ' + (error.message || 'Network error'))
      }
    }
  })
}

// Format date
function formatDate(dateStr: string) {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

// Load analyses on mount
onMounted(() => {
  loadAnalyses()
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

.content-card {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 13px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1e293b;
}

.required-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7em;
  font-weight: 500;
  margin-left: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #3F51B5;
  box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.1);
}

.help-text {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 4px;
}

.upload-section {
  margin-bottom: 30px;
}

.upload-section h3 {
  color: #1e293b;
  margin-bottom: 15px;
  font-weight: 600;
  font-size: 1.1rem;
}

.upload-area {
  border: 3px dashed #e2e8f0;
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  cursor: pointer;
  background: #f8fafc;
}

.upload-area:hover {
  border-color: #cbd5e1;
  background-color: #f1f5f9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.upload-area.dragover {
  border-color: #cbd5e1;
  background-color: #f1f5f9;
  transform: scale(1.01);
}

.upload-icon {
  font-size: 2.5em;
  color: #6b7280;
  margin-bottom: 10px;
}

.file-input {
  display: none;
}

.file-list {
  margin-top: 15px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 1.2em;
  color: #6b7280;
}

.remove-btn {
  background: #ec4899;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75em;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #be185d;
  transform: translateY(-1px);
}

.submit-btn {
  min-width: 300px;
  padding: 18px 40px;
  font-size: 1.2em;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
}

.previous-analyses {
  max-width: 800px;
  margin: 30px auto 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.previous-analyses-header {
  background: #f8fafc;
  color: #374151;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.previous-analyses-header h2 {
  font-size: 1.2em;
  margin: 0;
  font-weight: 600;
}

.previous-analyses-subtext {
  margin-top: 6px;
  font-size: 0.85em;
  color: #64748b;
}

.previous-analyses-content {
  padding: 0;
}

.analyses-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  background: #fff;
  font-size: 0.95em;
}

.analyses-table th,
.analyses-table td {
  border: 1px solid #e3e8ee;
  padding: 12px 16px;
  text-align: left;
  vertical-align: middle;
  line-height: 1.4;
  font-size: 0.95em;
  height: 50px;
}

.analyses-table th {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  font-size: 0.95em;
  border-bottom: 2px solid #e2e8f0;
}

.analyses-table td {
  background: #fff;
  color: #222e3a;
  font-weight: 500;
  border-bottom: 1px solid #e3e8ee;
}

.analyses-table tr:hover td {
  background: #f8f9fa;
}

.btn-view {
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  color: white !important;
}

.btn-delete {
  background: #d97706;
  color: white !important;
}

.btn-delete:hover {
  background: #b45309;
}

.no-analyses {
  text-align: center;
  color: #64748b;
  padding: 40px 20px;
  font-style: italic;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #cbd5e1;
}
</style>

