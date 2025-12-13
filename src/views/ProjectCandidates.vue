<template>
  <div class="hiretrac-project-candidates">
    <n-spin :show="loading">
      <!-- Project Header -->
      <div class="project-header">
        <div class="project-info">
          <h1>{{ project?.project_name || 'Loading...' }}</h1>
          <div class="project-breadcrumb">
            <router-link to="/candidates"><i class="fas fa-users"></i> Manage Candidates</router-link>
            <span> / {{ project?.project_name || '' }}</span>
          </div>
          <div v-if="project?.company || project?.position_title" class="project-meta">
            <span v-if="project?.company" class="company">{{ project.company }}</span>
            <span v-if="project?.position_title" class="position">{{ project.position_title }}</span>
          </div>
        </div>
        <div class="project-actions">
          <AppBackButton to="/candidates">Back to Dashboard</AppBackButton>
        </div>
      </div>

      <!-- Resume Migration Card -->
      <div :class="['migration-card', migrationState]">
        <div class="migration-header">
          <h3><i class="fas fa-sync-alt"></i> Resume Migration</h3>
          <p>Import candidate information from project resumes</p>
        </div>
        <div class="migration-content">
          <div class="migration-stats">
            <div class="stat-item">
              <span class="stat-number">{{ resumeStats.migrated_resumes }}</span>
              <span class="stat-label">Resumes tracking</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ resumeStats.pending_migration }}</span>
              <span class="stat-label">Pending Migration</span>
            </div>
          </div>
          <div class="migration-controls">
            <label class="toggle-container">
              <input type="checkbox" v-model="updateExisting">
              <span class="toggle-slider"></span>
              <span class="toggle-label">Update existing candidates</span>
            </label>
            <n-button 
              :type="migrationState === 'complete' ? 'success' : 'primary'"
              :loading="migrating"
              :disabled="migrating"
              @click="migrateResumes"
            >
              <i v-if="migrationState === 'complete'" class="fas fa-check"></i>
              <i v-else-if="migrating" class="fas fa-sync-alt fa-spin"></i>
              <i v-else class="fas fa-arrow-right"></i>
              {{ migrationButtonText }}
            </n-button>
          </div>
        </div>
      </div>

      <!-- Candidates Section -->
      <div class="candidates-section">
        <div class="candidates-header">
          <h2><i class="fas fa-users"></i> Candidates</h2>
          <div class="candidates-filters">
            <n-select
              v-model:value="stageFilter"
              style="width: 200px"
              :options="stageOptions"
              placeholder="All Stages"
              clearable
            />
          </div>
        </div>
        
        <div v-if="loadingCandidates" class="loading-state">
          <n-spin size="large" />
          <p>Loading candidates...</p>
        </div>

        <div v-else-if="filteredCandidates.length === 0" class="empty-candidates">
          <i class="fas fa-users"></i>
          <h3>No Candidates Found</h3>
          <p>Use the "Migrate Resumes" button above to import candidates from project resumes.</p>
        </div>

        <template v-else>
          <!-- Active Candidates -->
          <div v-if="activeCandidates.length > 0" class="candidates-section-group">
            <div class="section-header">
              <h3 class="section-title">Active Candidates ({{ activeCandidates.length }})</h3>
            </div>
            <table class="candidates-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Stage</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="candidate in activeCandidates" :key="candidate.candidate_id">
                  <td><strong>{{ candidate.name || candidate.resume_filename || 'N/A' }}</strong></td>
                  <td>{{ candidate.email || '-' }}</td>
                  <td>{{ candidate.phone || '-' }}</td>
                  <td>
                    <n-tag :type="getStageType(candidate.current_stage)">
                      {{ formatStage(candidate.current_stage) }}
                    </n-tag>
                  </td>
                  <td>
                    <span v-if="candidate.analysis_score" class="score">{{ candidate.analysis_score }}%</span>
                    <span v-else>-</span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <n-button 
                        type="primary"
                        size="small"
                        @click="viewCandidate(candidate.candidate_id)"
                      >
                        View
                      </n-button>
                      <n-button 
                        size="small"
                        class="move-down-btn"
                        @click="moveToNotInterested(candidate.candidate_id)"
                        title="Mark as Not Interested"
                        style="min-width: auto; padding: 0 0.75rem;"
                      >
                        <i class="fas fa-arrow-down"></i>
                      </n-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Not Interested Candidates -->
          <div v-if="notInterestedCandidates.length > 0" class="candidates-section-group not-interested">
            <div class="section-header">
              <h3 class="section-title">
                <i class="fas fa-times-circle" style="color: #9ca3af; margin-right: 0.5rem;"></i>
                Not Interested ({{ notInterestedCandidates.length }})
              </h3>
            </div>
            <table class="candidates-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Stage</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="candidate in notInterestedCandidates" :key="candidate.candidate_id">
                  <td><strong>{{ candidate.name || candidate.resume_filename || 'N/A' }}</strong></td>
                  <td>{{ candidate.email || '-' }}</td>
                  <td>{{ candidate.phone || '-' }}</td>
                  <td>
                    <n-tag type="default">
                      {{ formatStage(candidate.current_stage) }}
                    </n-tag>
                  </td>
                  <td>
                    <span v-if="candidate.analysis_score" class="score">{{ candidate.analysis_score }}%</span>
                    <span v-else>-</span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <n-button 
                        type="primary"
                        size="small"
                        @click="viewCandidate(candidate.candidate_id)"
                      >
                        View
                      </n-button>
                      <n-button 
                        size="small"
                        class="move-up-btn"
                        @click="moveToActive(candidate.candidate_id)"
                        title="Mark as Applied"
                        style="min-width: auto; padding: 0 0.75rem;"
                      >
                        <i class="fas fa-arrow-up"></i>
                      </n-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NSpin, NTag, NSelect, useMessage } from 'naive-ui'
import api from '@/utils/api'
import AppBackButton from '@/components/AppBackButton.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const projectId = computed(() => Number(route.params.projectId))
const project = ref<any>(null)
const resumeStats = ref({ migrated_resumes: 0, pending_migration: 0, total_resumes: 0 })
const candidates = ref<any[]>([])
const stageFilter = ref<string | null>(null)
const updateExisting = ref(false)
const loading = ref(true)
const loadingCandidates = ref(false)
const migrating = ref(false)
const migrationState = ref('')

const stageOptions = [
  { label: 'All Stages', value: '' },
  { label: 'Applied', value: 'applied' },
  { label: 'Phone Screen', value: 'phone_screen' },
  { label: 'Technical', value: 'technical' },
  { label: 'Interview', value: 'interview' },
  { label: 'Final Round', value: 'final_round' },
  { label: 'Offer Sent', value: 'offer_sent' },
  { label: 'Offer Accepted', value: 'offer_accepted' },
  { label: 'Offer Declined', value: 'offer_declined' },
  { label: 'Hired', value: 'hired' },
  { label: 'Rejected', value: 'rejected' }
]

const notInterestedStages = ['not_a_fit', 'rejected', 'withdrawn', 'declined', 'disqualified']

const filteredCandidates = computed(() => {
  if (!stageFilter.value || stageFilter.value === '') return candidates.value
  return candidates.value.filter(c => c.current_stage === stageFilter.value)
})

const activeCandidates = computed(() => {
  return filteredCandidates.value.filter(c => !notInterestedStages.includes(c.current_stage))
})

const notInterestedCandidates = computed(() => {
  return filteredCandidates.value.filter(c => notInterestedStages.includes(c.current_stage))
})

const migrationButtonText = computed(() => {
  if (migrationState.value === 'complete') return 'Migration Complete'
  if (migrating.value) return 'Migrating...'
  return 'Migrate Resumes'
})

onMounted(async () => {
  await loadProjectInfo()
  await loadCandidates()
  loading.value = false
})

async function loadProjectInfo() {
  try {
    const response = await api.get(`https://talent.api.4aitek.com/projects/${projectId.value}/candidates/page`)
    const data = response.data
    
    if (data.success) {
      project.value = data.project
      resumeStats.value = data.resume_stats
    } else {
      throw new Error(data.error || 'Failed to load project')
    }
  } catch (error: any) {
    // Don't show error for 401 - interceptor handles it
    if (error?.response?.status === 401) {
      return
    }
    console.error('Error loading project:', error)
    message.error('Failed to load project information')
  }
}

async function loadCandidates() {
  loadingCandidates.value = true
  try {
    const response = await api.get(`https://talent.api.4aitek.com/projects/${projectId.value}/candidates/list`)
    const data = response.data
    
    if (data.success) {
      candidates.value = data.candidates
    } else {
      throw new Error(data.error || 'Failed to load candidates')
    }
  } catch (error: any) {
    // Don't show error for 401 - interceptor handles it
    if (error?.response?.status === 401) {
      loadingCandidates.value = false
      return
    }
    console.error('Error loading candidates:', error)
    message.error('Failed to load candidates')
  } finally {
    loadingCandidates.value = false
  }
}

async function migrateResumes() {
  if (migrating.value) return
  
  migrating.value = true
  migrationState.value = 'processing'
  
  try {
    const response = await api.post(`https://talent.api.4aitek.com/projects/${projectId.value}/extract-personal-info`, null, {
      params: { update_existing: updateExisting.value }
    })
    const data = response.data
    
    if (data.success) {
      if (data.task_ids && data.task_ids.length > 0) {
        // Redirect to waiting page with task IDs
        const taskIdsParam = data.task_ids.join(',')
        router.push(`/migrate-resumes-waiting/${projectId.value}?taskIds=${taskIdsParam}`)
      } else {
        // No tasks to process
        message.success(data.message || 'No resumes to migrate')
        await loadProjectInfo()
        await loadCandidates()
        migrating.value = false
        migrationState.value = ''
      }
    } else {
      throw new Error(data.error || 'Migration failed')
    }
  } catch (error: any) {
    // Don't show error for 401 - interceptor handles it
    if (error?.response?.status === 401) {
      migrating.value = false
      migrationState.value = ''
      return
    }
    console.error('Migration error:', error)
    message.error(error.message || 'Failed to start migration')
    migrating.value = false
    migrationState.value = ''
  }
}

function viewCandidate(candidateId: number) {
  // Find the candidate to get both resume_id and project_id
  const candidate = [...activeCandidates.value, ...notInterestedCandidates.value].find(
    c => c.candidate_id === candidateId
  )
  if (candidate) {
    router.push(`/candidate/${candidate.resume_id}/${projectId.value}`)
  }
}

function getStageType(stage: string): any {
  const typeMap: any = {
    applied: 'info',
    phone_screen: 'info',
    technical: 'warning',
    interview: 'warning',
    final_round: 'warning',
    offer_sent: 'success',
    offer_accepted: 'success',
    hired: 'success',
    rejected: 'error',
    offer_declined: 'error'
  }
  return typeMap[stage] || 'default'
}

function formatStage(stage: string): string {
  if (!stage) return 'N/A'
  return stage.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function updateCandidateStage(candidateId: number, newStage: string) {
  try {
    const response = await api.post(`https://talent.api.4aitek.com/candidate/${candidateId}/update-stage`, {
      stage: newStage
    })
    const data = response.data
    
    if (data.success) {
      // Update local state
      const candidate = candidates.value.find(c => c.candidate_id === candidateId)
      if (candidate) {
        candidate.current_stage = newStage
      }
      message.success(`Candidate moved successfully`)
    } else {
      message.error(data.error || 'Failed to update candidate stage')
    }
  } catch (error: any) {
    // Don't show error for 401 - interceptor handles it
    if (error?.response?.status === 401) {
      return
    }
    console.error('Error updating candidate stage:', error)
    message.error('Failed to update candidate stage')
  }
}

async function moveToNotInterested(candidateId: number) {
  await updateCandidateStage(candidateId, 'not_a_fit')
}

async function moveToActive(candidateId: number) {
  await updateCandidateStage(candidateId, 'applied')
}
</script>

<style scoped>
.hiretrac-project-candidates {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Project Header */
.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.project-info h1 {
  color: #1e293b;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.project-breadcrumb {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.project-breadcrumb a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.project-breadcrumb a:hover {
  text-decoration: underline;
}

.project-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.project-meta .company {
  color: #3b82f6;
  font-weight: 500;
}

.project-meta .position {
  color: #059669;
  font-weight: 500;
}

/* Migration Card */
.migration-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.migration-card.processing {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.migration-card.complete {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.migration-header h3 {
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.migration-header p {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.migration-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.migration-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

.migration-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.toggle-container input {
  display: none;
}

.toggle-slider {
  width: 40px;
  height: 20px;
  background: #cbd5e1;
  border-radius: 10px;
  position: relative;
  transition: background 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
}

.toggle-container input:checked + .toggle-slider {
  background: #3b82f6;
}

.toggle-container input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-label {
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

/* Candidates Section */
.candidates-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}

.candidates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.candidates-header h2 {
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.candidates-section-group {
  margin-bottom: 2rem;
}

.candidates-section-group:last-child {
  margin-bottom: 0;
}

.candidates-section-group.not-interested {
  opacity: 0.7;
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.candidates-table {
  width: 100%;
  border-collapse: collapse;
}

.candidates-table th,
.candidates-table td {
  text-align: left;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.candidates-table th {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.candidates-table tbody tr:hover {
  background: #f8fafc;
}

.candidates-table tbody tr:last-child td {
  border-bottom: none;
}

.score {
  font-weight: 600;
  color: #3b82f6;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.view-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.view-btn i {
  font-size: 0.875rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.move-down-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: auto;
  width: auto;
  padding: 0 0.75rem;
  background: #6b7280;
  color: white;
  border: none;
  transition: all 0.2s ease;
}

.move-down-btn:hover {
  background: #4b5563 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.move-up-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: auto;
  width: auto;
  padding: 0 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  transition: all 0.2s ease;
}

.move-up-btn:hover {
  background: #059669 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.loading-state,
.empty-candidates {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.loading-state p,
.empty-candidates p {
  margin-top: 1rem;
  font-size: 1rem;
}

.empty-candidates i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-candidates h3 {
  color: #1e293b;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hiretrac-project-candidates {
    padding: 1rem;
  }
  
  .project-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .migration-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .migration-stats {
    width: 100%;
    justify-content: space-around;
  }
  
  .candidates-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .candidates-table {
    font-size: 0.875rem;
  }
  
  .candidates-table th,
  .candidates-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>
