<template>
  <div class="page-container">
    <PageBanner
      title="Create Patent"
      subtitle="Upload your patent disclosure for AI-powered patent drafting"
      :show-credits="false"
    />

    <div class="content-wrapper">
      <!-- Main Form Card -->
      <n-card class="content-card">
        <n-form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="patent-title">
              Patent Title
              <span class="required-badge">Required</span>
            </label>
            <input
              v-model="patentTitle"
              type="text"
              id="patent-title"
              placeholder="Enter descriptive title for your patent"
              class="form-input"
              required
            />
            <p class="help-text">This will be used as the working title for your patent draft.</p>
          </div>

          <div class="upload-section">
            <h3>Patent Disclosure <span class="required-badge">Required</span></h3>
            <div 
              class="upload-area" 
              :class="{ 'dragover': isDragging }"
              @click="triggerFileInput"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <div class="upload-icon"><i class="fas fa-pen-fancy"></i></div>
              <p>Click to upload patent disclosure file (PDF, DOCX, TXT, MD)</p>
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
              Create New Patent (10 credits)
            </n-button>
          </div>
        </n-form>
      </n-card>

      <!-- Previous Projects Table -->
      <div class="previous-projects">
        <div class="previous-projects-header">
          <h2>Previous Patent Projects</h2>
          <div class="previous-projects-subtext">
            Showing up to 20 most recent projects. Please delete older entries to keep your list organized.
          </div>
        </div>
        <div class="previous-projects-content">
          <div v-if="isLoadingProjects" class="loading-projects">
            <n-spin size="small" />
            <span style="margin-left: 8px;">Loading projects...</span>
          </div>
          <table v-else-if="projects.length > 0" class="projects-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="project in projects" :key="project.id">
                <td>{{ project.title }}</td>
                <td>Draft</td>
                <td>{{ formatDate(project.created_at) }}</td>
                <td>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <n-button
                      size="small"
                      class="btn-view"
                      @click="editProject(project.id)"
                    >
                      Edit
                    </n-button>
                    <n-button
                      size="small"
                      class="btn-delete"
                      @click="deleteProject(project.id)"
                    >
                      <i class="fas fa-times"></i>
                    </n-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="no-projects">
            No patent projects found. Start your first patent draft above!
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NButton, NSpin, useMessage, useDialog } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'
import api from '@/utils/api'
import { config } from '@/config'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

// Form data
const patentTitle = ref('')
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isSubmitting = ref(false)

// Previous projects
const projects = ref<any[]>([])
const isLoadingProjects = ref(false)

// Computed
const canSubmit = computed(() => {
  return patentTitle.value.trim() && selectedFile.value && !isSubmitting.value
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
    formData.append('patent_title', patentTitle.value.trim())
    formData.append('patent_disclosure', selectedFile.value!)

    const response = await api.post(`${config.patentApiUrl}/start-patent-creation`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    const data = response.data

    if (data.success) {
      message.success('Patent creation started! Redirecting to status page...')
      router.push(`/create-patent-waiting/${data.task_id}`)
    } else {
      message.error(data.detail || data.error || 'Failed to start patent creation')
    }
  } catch (error: any) {
    message.error('Error starting patent creation: ' + (error.message || 'Network error'))
  } finally {
    isSubmitting.value = false
  }
}

// Load previous projects
async function loadProjects() {
  isLoadingProjects.value = true
  try {
    const response = await api.get(`${config.patentApiUrl}/patent-projects`)
    const data = response.data
    if (data.success) {
      projects.value = data.projects || []
    }
  } catch (error: any) {
    console.error('Error loading projects:', error)
  } finally {
    isLoadingProjects.value = false
  }
}

// Edit project.
function editProject(projectId: number) {
  router.push(`/edit-patent/${projectId}`)
}

// Delete project
function deleteProject(projectId: number) {
  dialog.warning({
    title: 'Delete Project',
    content: 'Do you want to delete this project?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        const response = await api.delete(`${config.patentApiUrl}/api/delete-patent-project/${projectId}`)
        const data = response.data

        if (data.success) {
          message.success('Project deleted successfully')
          projects.value = projects.value.filter(p => p.id !== projectId)
        } else {
          message.error(data.message || 'Failed to delete project')
        }
      } catch (error: any) {
        message.error('Error deleting project: ' + (error.message || 'Network error'))
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

// Load projects on mount
onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.page-container {
  min-height: 100%;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.content-card {
  margin-bottom: 30px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
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

.required-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7em;
  font-weight: 500;
  margin-left: 8px;
}

.submit-btn {
  min-width: 300px;
  padding: 18px 40px;
  font-size: 1.2em;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  letter-spacing: 0.5px;
}

.previous-projects {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.previous-projects-header {
  background: #f8fafc;
  color: #374151;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.previous-projects-header h2 {
  font-size: 1.2em;
  margin: 0;
  font-weight: 600;
}

.previous-projects-subtext {
  margin-top: 6px;
  font-size: 0.85em;
  color: #64748b;
}

.previous-projects-content {
  padding: 0;
}

.loading-projects {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #64748b;
}

.projects-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  background: #fff;
  font-size: 0.95em;
}

.projects-table th,
.projects-table td {
  border: 1px solid #e3e8ee;
  padding: 12px 16px;
  text-align: left;
  vertical-align: middle;
  line-height: 1.4;
  font-size: 0.95em;
  font-weight: 500;
  color: #222e3a;
  height: 50px;
}

.projects-table th {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  font-size: 0.95em;
  border-bottom: 2px solid #e2e8f0;
}

.projects-table td {
  background: #fff;
  color: #222e3a;
  border-bottom: 1px solid #e3e8ee;
}

.projects-table tr:hover td {
  background: #f8f9fa;
}

.btn-view {
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%) !important;
  color: white !important;
}

.btn-view:hover {
  background: linear-gradient(135deg, #45a049 0%, #7cb342 100%) !important;
}

.btn-delete {
  background: #d97706 !important;
  color: white !important;
}

.btn-delete:hover {
  background: #b45309 !important;
}

.no-projects {
  text-align: center;
  color: #64748b;
  padding: 40px 20px;
  font-style: italic;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #cbd5e1;
  margin: 0;
}
</style>
