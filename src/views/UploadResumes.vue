<template>
  <div class="upload-container">
    <PageBanner title="Upload Resumes" />
    
    <div class="content-wrapper">
      <n-card title="Upload Candidate Resumes">
        <n-form>
          <n-form-item label="Select Project">
            <n-select
              v-model:value="selectedProject"
              :options="projectOptions"
              placeholder="Choose a recruiting project"
              :loading="isLoadingProjects"
            />
          </n-form-item>

          <n-form-item label="Upload Files">
            <n-upload
              ref="uploadRef"
              multiple
              :max="20"
              :accept="'.pdf,.doc,.docx,.txt'"
              :default-upload="false"
              @change="handleFileChange"
            >
              <n-button>
                <i class="fas fa-file-upload"></i> Select Files
              </n-button>
            </n-upload>
          </n-form-item>

          <n-button
            type="primary"
            @click="uploadFiles"
            :disabled="!selectedProject || fileList.length === 0"
            :loading="isUploading"
          >
            <i class="fas fa-cloud-upload-alt"></i> Upload {{ fileList.length }} File(s)
          </n-button>
        </n-form>

        <div v-if="uploadStatus" class="upload-status">
          <n-alert :type="uploadStatus.type" :title="uploadStatus.message" />
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NForm, NFormItem, NSelect, NUpload, NButton, NAlert, useMessage } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'

const message = useMessage()

const selectedProject = ref<number | null>(null)
const projectOptions = ref<any[]>([])
const isLoadingProjects = ref(false)
const fileList = ref<any[]>([])
const isUploading = ref(false)
const uploadStatus = ref<any>(null)

async function loadProjects() {
  isLoadingProjects.value = true
  try {
    const response = await fetch('https://talent.api.4aitek.com/projects', {
      credentials: 'include'
    })
    
    const data = await response.json()
    if (data.success) {
      projectOptions.value = data.projects.map((p: any) => ({
        label: p.project_name,
        value: p.project_id
      }))
    }
  } catch (error: any) {
    console.error('Error loading projects:', error)
    message.error('Failed to load projects')
  } finally {
    isLoadingProjects.value = false
  }
}

function handleFileChange(data: any) {
  fileList.value = data.fileList
}

async function uploadFiles() {
  if (!selectedProject.value || fileList.value.length === 0) return
  
  isUploading.value = true
  uploadStatus.value = null
  
  try {
    const formData = new FormData()
    fileList.value.forEach((fileObj: any) => {
      formData.append('files', fileObj.file)
    })
    
    const response = await fetch(
      `https://talent.api.4aitek.com/projects/${selectedProject.value}/upload`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData
      }
    )
    
    const data = await response.json()
    
    if (data.success) {
      uploadStatus.value = {
        type: 'success',
        message: data.message || 'Files uploaded successfully!'
      }
      fileList.value = []
      message.success('Upload complete!')
    } else {
      uploadStatus.value = {
        type: 'error',
        message: 'Upload failed. Please try again.'
      }
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    uploadStatus.value = {
      type: 'error',
      message: 'Upload failed: ' + error.message
    }
  } finally {
    isUploading.value = false
  }
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.upload-container {
  min-height: calc(100vh - 60px);
  background: #f8f9fa;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px 20px;
}

.upload-status {
  margin-top: 20px;
}
</style>

