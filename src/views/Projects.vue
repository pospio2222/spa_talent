<template>
  <div class="page-container">
    <PageBanner
      title="Manage Projects"
    />
    <div class="custom-subtitle">
      <i class="fas fa-sparkles"></i>
      <span>AI-powered evaluation of resumes in EN, 中文, and 한국어</span>
    </div>

    <div class="content-wrapper">
      <!-- Create New Project Button -->
      <div class="projects-overview">
        <div class="projects-grid">
          <button 
            @click="createNewProject" 
            class="project-action-card"
            :class="{ 'project-action-card-disabled': reachedLimit }"
            :disabled="reachedLimit"
          >
            <div class="card-icon">
              <i :class="reachedLimit ? 'fas fa-ban' : 'fas fa-plus-circle'"></i>
            </div>
            <div class="card-content">
              <h3>Create New Recruiting Project</h3>
            </div>
            <div class="card-arrow">
              <i :class="reachedLimit ? 'fas fa-lock' : 'fas fa-arrow-right'"></i>
            </div>
          </button>
        </div>
      </div>

      <!-- Project Limit Notice -->
      <div class="project-limit-notice">
        <p>You can create up to 20 recruiting projects. Please delete older projects to stay organized, or upgrade to our Enterprise plan for higher limits.</p>
      </div>

      <!-- Projects Table -->
      <div class="projects-table-container">
        <div v-if="loading" class="loading-state">
          <n-spin size="large" />
          <p>Loading projects...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>{{ error }}</p>
        </div>

        <div v-else-if="projects.length === 0" class="no-projects">
          <i class="fas fa-folder-open"></i>
          <h3>No Projects Found</h3>
          <p>Create your first recruiting project to get started.</p>
        </div>

        <div v-else class="table-wrapper">
          <table class="projects-table">
            <thead>
              <tr>
                <th>Upload<br>Resumes</th>
                <th>Analysis</th>
                <th @click="sortBy('project_name')" class="sortable">Project Name</th>
                <th @click="sortBy('company')" class="sortable">Company</th>
                <th @click="sortBy('position_title')" class="sortable">Position Title</th>
                <th @click="sortBy('description')" class="sortable">Description</th>
                <th @click="sortBy('jd_str')" class="sortable">Job Description</th>
                <th @click="sortBy('created_at')" class="sortable">Created At</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="project in sortedProjects" :key="project.project_id">
                <td class="link-cell">
                  <button 
                    @click="uploadResume(project.project_id)" 
                    class="cell-link upload"
                    title="Upload Resumes"
                  >
                    <i class="fas fa-plus"></i>
                  </button>
                </td>
                <td class="link-cell">
                  <button 
                    @click="viewAnalysis(project.project_id)" 
                    class="cell-link analysis"
                    title="Analysis"
                  >
                    <i class="fas fa-chart-line"></i>
                  </button>
                </td>
                <td :title="project.project_name">{{ project.project_name }}</td>
                <td :title="project.company">{{ project.company }}</td>
                <td :title="project.position_title">{{ project.position_title }}</td>
                <td :title="project.description">{{ project.description }}</td>
                <td :title="project.jd_str">{{ truncate(project.jd_str, 50) }}</td>
                <td>{{ formatDate(project.created_at) }}</td>
                <td class="link-cell">
                  <button 
                    @click="confirmDelete(project.project_id, project.project_name)" 
                    class="cell-link delete"
                    title="Delete Project"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NSpin, useDialog, useMessage } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'
import { config } from '@/config'
import api from '@/utils/api'

const router = useRouter()
const dialog = useDialog()
const message = useMessage()

interface Project {
  project_id: number
  project_name: string
  company: string
  position_title: string
  description: string
  jd_str: string
  created_at: string
  total_resumes: number
}

const projects = ref<Project[]>([])
const loading = ref(true)
const error = ref('')
const sortColumn = ref('')
const sortDirection = ref<'asc' | 'desc'>('desc')

const PROJECT_LIMIT = 20

const reachedLimit = computed(() => projects.value.length >= PROJECT_LIMIT)

const sortedProjects = computed(() => {
  if (!sortColumn.value) return projects.value

  const sorted = [...projects.value].sort((a, b) => {
    const aVal = a[sortColumn.value as keyof Project]
    const bVal = b[sortColumn.value as keyof Project]

    if (sortColumn.value === 'created_at') {
      return sortDirection.value === 'asc'
        ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
        : new Date(bVal as string).getTime() - new Date(aVal as string).getTime()
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection.value === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    return 0
  })

  return sorted
})

async function loadProjects() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.get(`${config.talentApiUrl}/projects`)
    const data = response.data
    projects.value = data.projects || []
  } catch (err: any) {
    console.error('Error loading projects:', err)
    error.value = err.message || 'Failed to load projects'
  } finally {
    loading.value = false
  }
}

function sortBy(column: string) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function createNewProject() {
  if (reachedLimit.value) {
    message.error(`You have reached your plan limit of ${PROJECT_LIMIT} projects. Please delete some projects or upgrade your plan.`)
    return
  }
  router.push('/create-project')
}

function uploadResume(projectId: number) {
  router.push(`/upload-resumes/${projectId}`)
}

function viewAnalysis(projectId: number) {
  router.push(`/project-analysis/${projectId}`)
}

function confirmDelete(projectId: number, projectName: string) {
  dialog.warning({
    title: 'Delete Project',
    content: `Are you sure you want to delete "${projectName}"? This action cannot be undone and will delete all associated data including resumes and analysis results.`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => deleteProject(projectId)
  })
}

async function deleteProject(projectId: number) {
  try {
    const formData = new FormData()
    formData.append('project_id', projectId.toString())

    const response = await api.post(`${config.talentApiUrl}/projects/delete`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    const data = response.data

    if (data.success) {
      message.success('Project deleted successfully')
      projects.value = projects.value.filter(p => p.project_id !== projectId)
    } else {
      throw new Error(data.message || 'Failed to delete project')
    }
  } catch (err: any) {
    console.error('Error deleting project:', err)
    message.error(err.message || 'Failed to delete project')
  }
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function truncate(text: string, length: number) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.custom-subtitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #3b82f6;
  padding: 0.5rem 2rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
}

.custom-subtitle i {
  font-size: 0.875rem;
  opacity: 0.8;
  color: #6366f1;
}

.content-wrapper {
  flex: 1;
  padding: 0.67rem;
  overflow-y: auto;
}

/* Projects Overview */
.projects-overview {
  padding: 5px 0;
  margin-bottom: 10px;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
}

.project-action-card {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
  border-radius: 8px;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(63, 81, 181, 0.3);
  position: relative;
  overflow: hidden;
  border: none;
  cursor: pointer;
  width: 100%;
}

.project-action-card:hover:not(.project-action-card-disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(63, 81, 181, 0.4);
}

.project-action-card-disabled {
  background: linear-gradient(135deg, #9E9E9E 0%, #757575 100%) !important;
  box-shadow: 0 4px 15px rgba(158, 158, 158, 0.3) !important;
  cursor: not-allowed;
  opacity: 0.8;
}

.card-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.card-icon i {
  font-size: 1.2rem;
  color: white;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: white;
}

.card-arrow {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.project-action-card:hover:not(.project-action-card-disabled) .card-arrow {
  transform: translateX(3px);
  background: rgba(255, 255, 255, 0.3);
}

.card-arrow i {
  font-size: 0.8rem;
  color: white;
}

/* Project Limit Notice */
.project-limit-notice {
  margin-bottom: 15px;
  text-align: center;
}

.project-limit-notice p {
  font-size: 0.85em;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

/* Table Container */
.projects-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  overflow: hidden;
  border: 1px solid #e9ecef;
  margin-top: 5px;
  min-height: 300px;
}

.table-wrapper {
  overflow-x: auto;
  max-height: 70vh;
  overflow-y: auto;
}

.projects-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  margin: 0;
  background: #fff;
  font-size: 0.95em;
}

.projects-table th,
.projects-table td {
  border: 1px solid #e3e8ee;
  padding: 0 3px;
  text-align: center;
  vertical-align: middle;
  line-height: 1;
  font-size: 0.95em;
  font-weight: 500;
  color: #222e3a;
  height: 40px;
  white-space: pre-line;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.projects-table th {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid #e2e8f0;
}

.projects-table th.sortable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.projects-table th.sortable:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.projects-table tbody tr td:nth-child(1) {
  background: #1E40AF;
  color: white;
}

.projects-table tbody tr td:nth-child(2) {
  background: #3B82F6;
  color: white;
}

.projects-table tbody tr td:nth-child(1) .cell-link i,
.projects-table tbody tr td:nth-child(2) .cell-link i {
  color: white !important;
  opacity: 0.9;
}

.projects-table td {
  background: #fff;
  color: #222e3a;
  border-bottom: 1px solid #e3e8ee;
  white-space: nowrap;
  max-width: 150px;
}

.projects-table tr:hover td {
  background: #f8f9fa;
}

.link-cell {
  width: 50px;
  min-width: 50px;
  max-width: 50px;
  padding: 0 !important;
}

.cell-link {
  display: block;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.cell-link.delete {
  background-color: #FF6B6B;
  color: white;
  padding: 8px;
  border-radius: 4px;
}

.cell-link.delete:hover {
  background-color: #FF4757;
  transform: scale(1.1);
}

.cell-link i {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  color: #374151;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.cell-link:hover i {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.3);
  color: #1e293b;
}

/* States */
.loading-state,
.error-state,
.no-projects {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.loading-state p,
.error-state p {
  margin-top: 1rem;
}

.error-state {
  color: #ef4444;
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-projects i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-projects h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #374151;
}

@media (max-width: 768px) {
  .projects-table {
    font-size: 0.8rem;
  }
  
  .projects-table th,
  .projects-table td {
    padding: 6px 8px;
  }
}
</style>
