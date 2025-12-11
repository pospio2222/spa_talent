<template>
  <div class="page-container">
    <PageBanner
      title="Upload Resumes"
      subtitle="Upload candidate resumes for analysis"
      :show-credits="false"
    />

    <div class="content-wrapper">
      <div class="upload-container">
        <!-- Project Information Card -->
        <n-card v-if="project" class="project-info-card">
          <h3>Project Information</h3>
          <div class="project-info-content">
            <div class="project-info-grid">
              <div class="project-info-item">
                <span class="project-info-label">Project Name</span>
                <span class="project-info-value">{{ project.project_name }}</span>
              </div>
              <div class="project-info-item">
                <span class="project-info-label">Company</span>
                <span class="project-info-value">{{ project.company }}</span>
              </div>
              <div class="project-info-item">
                <span class="project-info-label">Position Category</span>
                <span class="project-info-value">{{ project.position_category }}</span>
              </div>
              <div class="project-info-item">
                <span class="project-info-label">Position Title</span>
                <span class="project-info-value">{{ project.position_title }}</span>
              </div>
              <div v-if="project.description" class="project-info-item">
                <span class="project-info-label">Description</span>
                <span class="project-info-value">{{ project.description }}</span>
              </div>
            </div>
            <n-button @click="goBack" class="back-btn">
              <template #icon>
                <n-icon><ArrowBackOutline /></n-icon>
              </template>
              Back to Projects
            </n-button>
          </div>
        </n-card>

        <!-- Upload Form Card -->
        <n-card class="upload-form-card">
          <h3>Upload Resumes</h3>
          
          <n-alert v-if="error" type="error" :title="error" closable @close="error = null" style="margin-bottom: 1.5rem;" />
          
          <div class="file-selection-area">
            <label class="file-selection-label">Select Resume Files</label>
            <span class="file-selection-help">Supported formats: PDF, DOCX, TXT, Markdown (Max 10MB per file)</span>
            
            <div class="file-buttons">
              <n-button @click="chooseFiles" :disabled="uploading">
                <template #icon>
                  <n-icon><DocumentAttachOutline /></n-icon>
                </template>
                Choose Files
              </n-button>
              <n-button @click="chooseFolder" :disabled="uploading">
                <template #icon>
                  <n-icon><FolderOpenOutline /></n-icon>
                </template>
                Choose Folder
              </n-button>
            </div>
            
            <input
              ref="fileInput"
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md"
              style="display: none"
              @change="handleFileSelect"
            />
            <input
              ref="folderInput"
              type="file"
              multiple
              webkitdirectory
              accept=".pdf,.docx,.txt,.md"
              style="display: none"
              @change="handleFileSelect"
            />
            
            <div
              class="file-list-container"
              :class="{ dragover: isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <ul class="file-list">
                <li v-if="selectedFiles.length === 0" class="empty-message">
                  No files selected. Drag and drop files here or use the buttons above.
                </li>
                <li v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  <button class="remove-file" @click="removeFile(index)" :disabled="uploading">
                    <n-icon><CloseOutline /></n-icon>
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="form-actions">
            <n-button
              type="primary"
              class="upload-btn"
              :loading="uploading"
              :disabled="selectedFiles.length === 0"
              @click="handleUpload"
            >
              <template #icon>
                <n-icon><CloudUploadOutline /></n-icon>
              </template>
              {{ uploading ? 'Uploading...' : 'Upload Resumes' }}
            </n-button>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NIcon, NAlert, useMessage } from 'naive-ui'
import {
  DocumentAttachOutline,
  FolderOpenOutline,
  CloseOutline,
  CloudUploadOutline,
  ArrowBackOutline
} from '@vicons/ionicons5'
import PageBanner from '@/components/PageBanner.vue'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const projectId = ref(parseInt(route.params.projectId as string))
const project = ref<any>(null)
const selectedFiles = ref<File[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const folderInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const error = ref<string | null>(null)

const apiUrl = import.meta.env.VITE_API_URL || 'https://talent.api.4aitek.com'

onMounted(async () => {
  await loadProjectInfo()
})

async function loadProjectInfo() {
  try {
    const response = await api.get(`${apiUrl}/projects/${projectId.value}/resumes`)
    const data = response.data
    if (data.success && data.project) {
      project.value = data.project
    }
  } catch (err: any) {
    message.error('Failed to load project information')
    console.error('Error loading project:', err)
  }
}

function chooseFiles() {
  fileInput.value?.click()
}

function chooseFolder() {
  folderInput.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) {
    const newFiles = Array.from(input.files).filter(
      file => !file.name.startsWith('~$')
    )
    selectedFiles.value = newFiles
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    const droppedFiles = Array.from(event.dataTransfer.files).filter(
      file => !file.name.startsWith('~$')
    )
    selectedFiles.value = [...selectedFiles.value, ...droppedFiles]
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function goBack() {
  router.push('/projects')
}

async function handleUpload() {
  if (selectedFiles.value.length === 0) {
    error.value = 'Please select at least one resume file'
    return
  }

  uploading.value = true
  error.value = null

  try {
    const formData = new FormData()
    selectedFiles.value.forEach(file => {
      formData.append('resumes', file)
    })

    const response = await api.post(`${apiUrl}/projects/${projectId.value}/upload-resumes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    const data = response.data
    
    if (data.success && data.task_id) {
      message.success('Resume upload started')
      // Navigate to waiting page
      router.push(`/upload-resumes-waiting/${projectId.value}/${data.task_id}`)
    } else {
      throw new Error(data.error || 'Upload failed')
    }
  } catch (err: any) {
    const errorMsg = err.message || 'Failed to upload resumes'
    error.value = errorMsg
    message.error(errorMsg)
    console.error('Upload error:', err)
  } finally {
    uploading.value = false
  }
}
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

.upload-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
}

.project-info-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.project-info-card h3 {
  color: #1e40af;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.project-info-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.project-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  flex: 1;
  font-size: 1rem;
}

.project-info-item {
  display: flex;
  flex-direction: column;
}

.project-info-label {
  font-weight: 600;
  color: #3b82f6;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.project-info-value {
  color: #1e293b;
  font-weight: 500;
  word-break: break-word;
}

.back-btn {
  flex-shrink: 0;
  background: rgba(148, 163, 184, 0.1) !important;
  color: var(--text-dark, #1e293b) !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(148, 163, 184, 0.15) !important;
  color: var(--text-dark, #1e293b) !important;
  border-color: rgba(59, 130, 246, 0.5) !important;
}

.upload-form-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.upload-form-card h3 {
  color: #1e40af;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.file-selection-area {
  margin-bottom: 1.5rem;
}

.file-selection-label {
  display: block;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.file-selection-help {
  display: block;
  margin-bottom: 1rem;
  color: #64748b;
  font-size: 0.9rem;
}

.file-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.file-list-container {
  background: rgba(255, 255, 255, 0.8);
  border: 2px dashed #3b82f6;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  min-height: 120px;
  transition: all 0.3s ease;
}

.file-list-container.dragover {
  border-color: #1d4ed8;
  background: rgba(239, 246, 255, 0.8);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

.file-list .empty-message {
  text-align: center;
  color: #64748b;
  font-style: italic;
  border: none;
  background: none;
  padding: 0;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  border-left: 4px solid #3b82f6;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
  word-break: break-all;
}

.file-size {
  font-size: 0.85rem;
  color: #64748b;
  margin-left: 0.5rem;
}

.remove-file {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
}

.remove-file:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
}

.remove-file:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.upload-btn {
  width: 100%;
  height: 3.75rem;
  font-size: 1.1rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .upload-container {
    padding: 1rem;
  }
  
  .project-info-content {
    grid-template-columns: 1fr;
  }
  
  .file-buttons {
    flex-direction: column;
  }
}
</style>
