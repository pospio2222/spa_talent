<template>
  <div class="projects-container">
    <PageBanner title="Recruiting Projects" />
    
    <div class="content-wrapper">
      <!-- Create New Project -->
      <n-card title="Create New Project" class="create-project-card">
        <n-form ref="formRef" :model="formData">
          <n-form-item label="Project Name" path="project_name">
            <n-input v-model:value="formData.project_name" placeholder="e.g., Senior Software Engineer - Q1 2025" />
          </n-form-item>
          
          <n-form-item label="Job Description" path="job_description">
            <n-input
              v-model:value="formData.job_description"
              type="textarea"
              placeholder="Paste the job description here..."
              :rows="6"
            />
          </n-form-item>
          
          <n-button type="primary" @click="createProject" :loading="isCreating">
            <i class="fas fa-plus"></i> Create Project
          </n-button>
        </n-form>
      </n-card>

      <!-- Projects List -->
      <n-card title="Your Projects" class="projects-list-card">
        <n-spin :show="isLoading">
          <div v-if="projects.length === 0" class="empty-state">
            <i class="fas fa-folder-open"></i>
            <p>No projects yet. Create your first recruiting project above!</p>
          </div>
          
          <div v-else class="projects-grid">
            <n-card
              v-for="project in projects"
              :key="project.project_id"
              hoverable
              class="project-card"
              @click="viewProject(project.project_id)"
            >
              <div class="project-header">
                <h3>{{ project.project_name }}</h3>
                <n-tag type="info">{{ project.total_candidates }} Candidates</n-tag>
              </div>
              <p class="project-description">{{ truncateText(project.job_description, 150) }}</p>
              <div class="project-footer">
                <span class="created-date">
                  <i class="fas fa-calendar"></i> {{ formatDate(project.created_at) }}
                </span>
              </div>
            </n-card>
          </div>
        </n-spin>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NSpin, NTag, useMessage } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'

const router = useRouter()
const message = useMessage()

const formData = ref({
  project_name: '',
  job_description: ''
})

const projects = ref<any[]>([])
const isLoading = ref(false)
const isCreating = ref(false)

async function loadProjects() {
  isLoading.value = true
  try {
    const response = await fetch('https://talent.api.4aitek.com/projects', {
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to load projects')
    }
    
    const data = await response.json()
    if (data.success) {
      projects.value = data.projects
    }
  } catch (error: any) {
    console.error('Error loading projects:', error)
    message.error('Failed to load projects')
  } finally {
    isLoading.value = false
  }
}

async function createProject() {
  if (!formData.value.project_name || !formData.value.job_description) {
    message.warning('Please fill in all fields')
    return
  }
  
  isCreating.value = true
  try {
    const formDataToSend = new FormData()
    formDataToSend.append('project_name', formData.value.project_name)
    formDataToSend.append('job_description', formData.value.job_description)
    
    const response = await fetch('https://talent.api.4aitek.com/projects', {
      method: 'POST',
      credentials: 'include',
      body: formDataToSend
    })
    
    const data = await response.json()
    
    if (data.success) {
      message.success('Project created successfully!')
      formData.value.project_name = ''
      formData.value.job_description = ''
      loadProjects()
    } else {
      message.error('Failed to create project')
    }
  } catch (error: any) {
    console.error('Error creating project:', error)
    message.error('Error creating project')
  } finally {
    isCreating.value = false
  }
}

function viewProject(projectId: number) {
  router.push(`/project/${projectId}/candidates`)
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.projects-container {
  min-height: calc(100vh - 60px);
  background: #f8f9fa;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.create-project-card {
  margin-bottom: 30px;
}

.projects-list-card {
  min-height: 300px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
}

.empty-state i {
  font-size: 4em;
  margin-bottom: 20px;
  opacity: 0.5;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.project-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.project-header h3 {
  margin: 0;
  font-size: 1.2em;
  color: #2d3748;
  flex: 1;
  margin-right: 10px;
}

.project-description {
  color: #4a5568;
  line-height: 1.6;
  margin: 15px 0;
  min-height: 60px;
}

.project-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 15px;
  margin-top: 15px;
}

.created-date {
  color: #718096;
  font-size: 0.9em;
}

.created-date i {
  margin-right: 5px;
}
</style>

