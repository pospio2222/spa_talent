<template>
  <div class="hiretrac-dashboard">
    <!-- Candidate Pipeline Statistics -->
    <div v-if="Object.keys(pipelineStats).length > 0" class="stats-overview">
      <div class="stats-grid">
        <div class="stat-card applied">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{ pipelineStats.applied || 0 }}</h3>
            <p>Applied</p>
          </div>
        </div>
        <div class="stat-card phone_screen">
          <div class="stat-icon">
            <i class="fas fa-phone"></i>
          </div>
          <div class="stat-content">
            <h3>{{ pipelineStats.phone_screen || 0 }}</h3>
            <p>Phone Screen</p>
          </div>
        </div>
        <div class="stat-card interview">
          <div class="stat-icon">
            <i class="fas fa-comments"></i>
          </div>
          <div class="stat-content">
            <h3>{{ pipelineStats.interview || 0 }}</h3>
            <p>Interview</p>
          </div>
        </div>
        <div class="stat-card offer_sent">
          <div class="stat-icon">
            <i class="fas fa-file-contract"></i>
          </div>
          <div class="stat-content">
            <h3>{{ pipelineStats.offer_sent || 0 }}</h3>
            <p>Offers Sent</p>
          </div>
        </div>
        <div class="stat-card hired">
          <div class="stat-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h3>{{ (pipelineStats.offer_accepted || 0) + (pipelineStats.hired || 0) }}</h3>
            <p>Offer Accepted</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Projects Section -->
    <div class="projects-section">
      <div class="section-header">
        <h2><i class="fas fa-briefcase"></i> Your Projects</h2>
        <p class="section-subtitle">Click on a project to manage candidates</p>
      </div>
      
      <n-spin :show="loading">
        <template v-if="projects.length > 0">
          <div class="projects-grid">
            <div 
              v-for="project in projects" 
              :key="project.project_id" 
              class="project-card"
              @click="goToProjectCandidates(project.project_id)"
            >
              <div class="project-header">
                <div class="project-info">
                  <div class="project-title">{{ project.project_name }}</div>
                  <div class="project-meta">
                    <span v-if="project.company" class="company">{{ project.company }}</span>
                    <span v-if="project.company && project.position_title"> • </span>
                    <span v-if="project.position_title" class="position">{{ project.position_title }}</span>
                    <span v-if="project.created_at"> • </span>
                    <span v-if="project.created_at" class="date">{{ formatDate(project.created_at) }}</span>
                    <span> • </span>
                    <span class="candidates">{{ project.candidate_count }} candidates</span>
                    <span> • </span>
                    <span class="hired">{{ project.hired_count }} hired</span>
                  </div>
                </div>
                <div class="project-actions">
                  <i class="fas fa-external-link-alt"></i>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-folder-open"></i>
            </div>
            <h3>No Projects Found</h3>
            <p>You don't have any projects yet. Create a project in the <router-link to="/projects">Resume Analysis</router-link> section to get started with candidate tracking.</p>
            <div class="empty-actions">
              <n-button type="primary" @click="$router.push('/create-project')">
                <i class="fas fa-plus"></i> Create Project
              </n-button>
            </div>
          </div>
        </template>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NSpin, NButton, useMessage } from 'naive-ui'
import { config } from '@/config'
import api from '@/utils/api'

const router = useRouter()
const message = useMessage()

interface Project {
  project_id: number
  project_name: string
  company: string | null
  position_title: string | null
  description: string | null
  created_at: string
  candidate_count: number
  hired_count: number
}

const projects = ref<Project[]>([])
const pipelineStats = ref<Record<string, number>>({})
const loading = ref(true)

onMounted(async () => {
  await loadDashboard()
})

async function loadDashboard() {
  loading.value = true
  try {
    const response = await api.get(`${config.talentApiUrl}/candidates/dashboard`)
    const data = response.data
    
    if (data.success) {
      projects.value = data.projects
      pipelineStats.value = data.pipeline_stats || {}
    } else {
      throw new Error(data.error || 'Failed to load dashboard')
    }
  } catch (error: any) {
    // Don't show error for 401 - interceptor handles it
    if (error?.response?.status === 401) {
      loading.value = false
      return
    }
    console.error('Error loading dashboard:', error)
    message.error('Failed to load candidates dashboard')
  } finally {
    loading.value = false
  }
}

function goToProjectCandidates(projectId: number) {
  router.push(`/project/${projectId}/candidates`)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
.hiretrac-dashboard {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Stats Overview */
.stats-overview {
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.stat-card.applied .stat-icon {
  background: linear-gradient(135deg, #3F51B5, #2196F3);
}
.stat-card.phone_screen .stat-icon {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
}
.stat-card.interview .stat-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.stat-card.offer_sent .stat-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}
.stat-card.hired .stat-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.stat-content h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1;
}

.stat-content p {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0.25rem 0 0 0;
  font-weight: 500;
}

/* Projects Section */
.projects-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f5f9;
}

.section-header {
  margin-bottom: 1rem;
}

.section-header h2 {
  color: #1e293b;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.section-header h2 i {
  color: #3b82f6;
  margin-right: 0.5rem;
}

.section-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0.75rem;
}

.project-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.project-card:hover .project-actions i {
  transform: translateX(2px);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.project-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.project-meta {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.3;
}

.project-meta .company {
  color: #3b82f6;
  font-weight: 500;
}

.project-meta .position {
  color: #059669;
  font-weight: 500;
}

.project-actions i {
  color: #3b82f6;
  font-size: 1rem;
  transition: transform 0.3s ease;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  color: #1e293b;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.empty-state p {
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.empty-state p a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.empty-state p a:hover {
  text-decoration: underline;
}

.empty-actions {
  display: flex;
  justify-content: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hiretrac-dashboard {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .projects-section {
    padding: 1.5rem;
  }
}
</style>

