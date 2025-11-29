<template>
  <div class="candidate-detail-container">
    <PageBanner title="Candidate Detail" />
    
    <div class="content-wrapper">
      <n-card>
        <n-button @click="$router.back()" class="back-btn">
          <i class="fas fa-arrow-left"></i> Back
        </n-button>
        
        <div v-if="loading" class="loading-state">
          <n-spin size="large" />
          <p>Loading candidate details...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <p>Error: {{ error }}</p>
          <n-button @click="loadCandidateDetails">Retry</n-button>
        </div>
        
        <div v-else-if="candidate" class="detail-content">
          <!-- Candidate Header -->
          <div class="candidate-header">
            <div class="candidate-info">
              <div class="candidate-breadcrumb">
                <router-link to="/projects"><i class="fas fa-users"></i> Manage Candidates</router-link>
                <span> / </span>
                <router-link :to="`/project/${candidate.project_id}/candidates`">{{ candidate.project_name }}</router-link>
                <span> / {{ candidate.name || 'Candidate Details' }}</span>
              </div>
              <h1>{{ candidate.name || 'Unknown Candidate' }}</h1>
              <div class="candidate-meta">
                <span class="position">{{ candidate.position_title }}</span>
                <span class="company">{{ candidate.company }}</span>
              </div>
            </div>
            <div class="candidate-actions">
              <n-button @click="$router.back()">
                <i class="fas fa-arrow-left"></i> Back to Candidates
              </n-button>
            </div>
          </div>

          <!-- Candidate Summary -->
          <div class="candidate-summary">
            <div class="summary-card">
              <div class="card-header">
                <h3><i class="fas fa-user"></i> Contact Information</h3>
                <n-button v-if="!isEditMode" type="default" size="small" @click="toggleEditMode">
                  <i class="fas fa-edit"></i> Edit
                </n-button>
                <div v-else class="edit-actions">
                  <n-button type="primary" size="small" @click="saveContactInfo">
                    <i class="fas fa-save"></i> Save
                  </n-button>
                  <n-button type="default" size="small" @click="toggleEditMode">
                    <i class="fas fa-times"></i> Cancel
                  </n-button>
                </div>
              </div>
              
              <!-- View Mode -->
              <div v-if="!isEditMode" class="contact-info">
                <div class="contact-item">
                  <label>Email:</label>
                  <span>{{ candidate.email || 'Not provided' }}</span>
                </div>
                <div class="contact-item">
                  <label>Phone:</label>
                  <span>{{ candidate.phone || 'Not provided' }}</span>
                </div>
                <div class="contact-item">
                  <label>Location:</label>
                  <span>{{ candidate.location || 'Not provided' }}</span>
                </div>
                <div class="contact-item">
                  <label>LinkedIn:</label>
                  <span>
                    <a v-if="candidate.linkedin_url" :href="candidate.linkedin_url" target="_blank">{{ candidate.linkedin_url }}</a>
                    <span v-else>Not provided</span>
                  </span>
                </div>
                <div class="contact-item">
                  <label>Current Company:</label>
                  <span>{{ candidate.current_company || 'Not provided' }}</span>
                </div>
                <div class="contact-item">
                  <label>Experience Years:</label>
                  <span>{{ candidate.experience_years || 'Not provided' }}</span>
                </div>
              </div>
              
              <!-- Edit Mode -->
              <div v-else class="contact-edit-form">
                <div class="form-group">
                  <label>Name:</label>
                  <n-input v-model:value="editForm.name" placeholder="Name" />
                </div>
                <div class="form-group">
                  <label>Email:</label>
                  <n-input v-model:value="editForm.email" placeholder="Email" />
                </div>
                <div class="form-group">
                  <label>Phone:</label>
                  <n-input v-model:value="editForm.phone" placeholder="Phone" />
                </div>
                <div class="form-group">
                  <label>Location:</label>
                  <n-input v-model:value="editForm.location" placeholder="Location" />
                </div>
                <div class="form-group">
                  <label>Current Company:</label>
                  <n-input v-model:value="editForm.current_company" placeholder="Current Company" />
                </div>
                <div class="form-group">
                  <label>LinkedIn:</label>
                  <n-input v-model:value="editForm.linkedin_url" placeholder="LinkedIn URL" />
                </div>
                <div class="form-group">
                  <label>Experience Years:</label>
                  <n-input-number v-model:value="editForm.experience_years" :min="0" placeholder="Years" />
                </div>
              </div>
            </div>

            <div class="summary-card">
              <div class="card-header">
                <h3><i class="fas fa-chart-pie"></i> Status & Progress</h3>
                <select class="stage-dropdown" @change="updateStage" :value="candidate.current_stage">
                  <option v-for="stage in stageOptions" :key="stage.value" :value="stage.value">
                    {{ stage.label }}
                  </option>
                </select>
              </div>
              <div class="status-info">
                <div class="status-item">
                  <label>Current Stage:</label>
                  <span :class="['stage-badge', `stage-${candidate.current_stage}`]">
                    {{ formatStage(candidate.current_stage) }}
                  </span>
                </div>
                <div class="status-item">
                  <label>Analysis Score:</label>
                  <span class="score-badge">{{ candidate.analysis_score || 'N/A' }}</span>
                </div>
                <div class="status-item">
                  <label>Last Updated:</label>
                  <span>{{ candidate.stage_updated_at_str || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Content Tabs -->
          <div class="content-container">
            <div class="tabs-header">
              <button 
                :class="['tab-button', { active: activeTab === 'notes' }]" 
                @click="activeTab = 'notes'"
              >
                <i class="fas fa-sticky-note"></i> Notes
              </button>
              <button 
                :class="['tab-button', { active: activeTab === 'resume' }]" 
                @click="activeTab = 'resume'"
              >
                <i class="fas fa-file-alt"></i> Resume
              </button>
              <button 
                :class="['tab-button', { active: activeTab === 'analysis' }]" 
                @click="activeTab = 'analysis'"
              >
                <i class="fas fa-chart-pie"></i> Analysis
              </button>
            </div>

            <div v-show="activeTab === 'notes'" class="tab-content active">
              <div class="content-card">
                <div class="card-header">
                  <h3><i class="fas fa-sticky-note"></i> Interview Notes</h3>
                </div>
                
                <!-- Add Note Form -->
                <div class="add-note-form">
                  <n-input
                    v-model:value="newNote"
                    type="textarea"
                    placeholder="Add a note about this candidate..."
                    :rows="3"
                    class="note-textarea"
                  />
                  <n-button type="primary" @click="addNoteHandler" :disabled="!newNote.trim()">
                    <i class="fas fa-plus"></i> Add Note
                  </n-button>
                </div>
                
                <!-- Notes List -->
                <div class="notes-content">
                  <div v-if="notes.length > 0" class="notes-list">
                    <div v-for="note in notes" :key="note.id" class="note-item">
                      <div class="note-header">
                        <span class="note-author">{{ note.author_name }}</span>
                        <span class="note-date">{{ note.created_at_str }}</span>
                        <button class="note-delete-btn" @click="deleteNoteHandler(note.id)" title="Delete note">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                      <div class="note-content">{{ note.content }}</div>
                    </div>
                  </div>
                  <div v-else class="empty-notes">
                    <i class="fas fa-sticky-note"></i>
                    <p>No notes yet. Add your first note about this candidate.</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'resume'" class="tab-content">
              <div class="content-card">
                <div class="card-header">
                  <h3><i class="fas fa-file-alt"></i> Resume Content</h3>
                </div>
                <div v-if="candidate.resume_str" class="resume-content">
                  <pre>{{ candidate.resume_str }}</pre>
                </div>
                <p v-else>No resume content available for this candidate.</p>
              </div>
            </div>

            <div v-show="activeTab === 'analysis'" class="tab-content">
              <div class="content-card">
                <div class="card-header">
                  <h3><i class="fas fa-chart-pie"></i> Analysis Report</h3>
                  <div class="header-actions">
                    <span class="score-display">Score: {{ candidate.analysis_score || 'N/A' }}</span>
                  </div>
                </div>
                <div v-if="candidate.descriptive_html || candidate.tabular_html" class="analysis-content">
                  <div v-if="candidate.descriptive_html" class="analysis-section">
                    <h4>Analysis Summary</h4>
                    <div class="markdown-content" v-html="candidate.descriptive_html"></div>
                  </div>
                  <div v-if="candidate.tabular_html" class="analysis-section">
                    <h4>Detailed Breakdown</h4>
                    <div class="markdown-content" v-html="candidate.tabular_html"></div>
                  </div>
                </div>
                <p v-else>No analysis available for this candidate.</p>
              </div>
            </div>
          </div>

          <!-- Calendar Card -->
          <div class="calendar-card">
            <div class="content-card">
              <div class="card-header">
                <h3><i class="fas fa-calendar-alt"></i> Interview Calendar</h3>
              </div>
              <div class="calendar-content">
                <iframe 
                  src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FLos_Angeles&showPrint=0&src=YWRtaW5ANGFpdGVjaG5vbG9neS5jb20&src=NmU4N2YyZWIxMmVhZDUzODgwMTI0NjljNWI3MmZjOTg2ZTZjMmIzYmE3OWEzZWFjMDIzYzMzNmNmZDEzNTc1OUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%23039be5&color=%23009688"
                  style="border:solid 1px #777; width: 100%; height: 600px;"
                  frameborder="0"
                  scrolling="no"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>Candidate not found.</p>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NSpin, NInput, NInputNumber, useMessage, useDialog } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'

const route = useRoute()
const message = useMessage()
const dialog = useDialog()

const resumeId = computed(() => Number(route.params.resumeId))
const projectId = computed(() => Number(route.params.projectId))

const candidate = ref<any>(null)
const notes = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref('notes')
const isEditMode = ref(false)
const editForm = ref({
  name: '',
  email: '',
  phone: '',
  location: '',
  current_company: '',
  linkedin_url: '',
  experience_years: 0
})
const newNote = ref('')

const stageOptions = [
  { label: 'Applied', value: 'applied' },
  { label: 'Phone Screen', value: 'phone_screen' },
  { label: 'Technical', value: 'technical' },
  { label: 'Interview', value: 'interview' },
  { label: 'Final Round', value: 'final_round' },
  { label: 'Offer Sent', value: 'offer_sent' },
  { label: 'Offer Accepted', value: 'offer_accepted' },
  { label: 'Offer Declined', value: 'offer_declined' },
  { label: 'Hired', value: 'hired' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Not a Fit', value: 'not_a_fit' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Declined', value: 'declined' },
  { label: 'Disqualified', value: 'disqualified' }
]

function formatStage(stage: string): string {
  if (!stage) return 'N/A'
  return stage.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

async function loadCandidateDetails() {
  loading.value = true
  error.value = null
  try {
    const response = await fetch(`https://talent.api.4aitek.com/candidate/${resumeId.value}/${projectId.value}`, {
      credentials: 'include'
    })
    const data = await response.json()

    if (data.success) {
      candidate.value = data.candidate
      notes.value = data.notes || []
      
      editForm.value = {
        name: candidate.value.name || '',
        email: candidate.value.email || '',
        phone: candidate.value.phone || '',
        location: candidate.value.location || '',
        current_company: candidate.value.current_company || '',
        linkedin_url: candidate.value.linkedin_url || '',
        experience_years: candidate.value.experience_years || 0
      }
    } else {
      error.value = data.error || 'Failed to load candidate details.'
      message.error(error.value || 'Failed to load candidate details.')
    }
  } catch (err: any) {
    console.error('Error loading candidate details:', err)
    error.value = 'Network error or server unreachable.'
    message.error('Network error or server unreachable.')
  } finally {
    loading.value = false
  }
}

function toggleEditMode() {
  if (isEditMode.value) {
    editForm.value = {
      name: candidate.value.name || '',
      email: candidate.value.email || '',
      phone: candidate.value.phone || '',
      location: candidate.value.location || '',
      current_company: candidate.value.current_company || '',
      linkedin_url: candidate.value.linkedin_url || '',
      experience_years: candidate.value.experience_years || 0
    }
  }
  isEditMode.value = !isEditMode.value
}

async function saveContactInfo() {
  try {
    const response = await fetch(`https://talent.api.4aitek.com/candidate/${candidate.value.candidate_id}/update-info`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editForm.value)
    })
    const data = await response.json()

    if (data.success) {
      candidate.value = {
        ...candidate.value,
        ...editForm.value
      }
      isEditMode.value = false
      message.success('Contact information updated successfully!')
    } else {
      message.error(data.error || 'Failed to update contact information.')
    }
  } catch (err: any) {
    console.error('Error updating contact info:', err)
    message.error('Failed to update contact information.')
  }
}

async function updateStage(event: any) {
  const newStage = event.target.value
  try {
    const response = await fetch(`https://talent.api.4aitek.com/candidate/${candidate.value.candidate_id}/update-stage`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stage: newStage })
    })
    const data = await response.json()

    if (data.success) {
      candidate.value.current_stage = newStage
      message.success('Stage updated successfully!')
    } else {
      message.error(data.error || 'Failed to update stage.')
      event.target.value = candidate.value.current_stage
    }
  } catch (err: any) {
    console.error('Error updating stage:', err)
    message.error('Failed to update stage.')
    event.target.value = candidate.value.current_stage
  }
}

async function addNoteHandler() {
  if (!newNote.value.trim()) {
    message.warning('Please enter a note.')
    return
  }

  try {
    const response = await fetch(`https://talent.api.4aitek.com/candidate/${candidate.value.candidate_id}/notes`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ note: newNote.value })
    })
    const data = await response.json()

    if (data.success) {
      message.success('Note added successfully!')
      newNote.value = ''
      await loadCandidateDetails()
    } else {
      message.error(data.error || 'Failed to add note.')
    }
  } catch (err: any) {
    console.error('Error adding note:', err)
    message.error('Failed to add note.')
  }
}

function deleteNoteHandler(noteId: number) {
  dialog.warning({
    title: 'Delete Note',
    content: 'Are you sure you want to delete this note?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        const response = await fetch(`https://talent.api.4aitek.com/candidate/${candidate.value.candidate_id}/notes`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ note_id: noteId })
        })
        const data = await response.json()

        if (data.success) {
          message.success('Note deleted successfully!')
          await loadCandidateDetails()
        } else {
          message.error(data.error || 'Failed to delete note.')
        }
      } catch (err: any) {
        console.error('Error deleting note:', err)
        message.error('Failed to delete note.')
      }
    }
  })
}

onMounted(() => {
  loadCandidateDetails()
})
</script>

<style scoped>
.candidate-detail-container {
  min-height: calc(100vh - 60px);
  background: #f8f9fa;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.back-btn {
  margin-bottom: 1.5rem;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
}

.loading-state .n-spin {
  margin-bottom: 20px;
}

.candidate-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.candidate-breadcrumb {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.candidate-breadcrumb a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.candidate-breadcrumb a:hover {
  text-decoration: underline;
}

.candidate-info h1 {
  color: #1e293b;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.candidate-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.candidate-meta .position {
  color: #059669;
  font-weight: 500;
}

.candidate-meta .company {
  color: #3b82f6;
  font-weight: 500;
}

.candidate-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f5f9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  color: #1e293b;
  font-size: 1.125rem;
  margin: 0;
  font-weight: 600;
}

.card-header h3 i {
  color: #3b82f6;
  margin-right: 0.5rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.contact-info, .status-info {
  display: grid;
  gap: 1rem;
}

.contact-item, .status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f8fafc;
}

.contact-item:last-child, .status-item:last-child {
  border-bottom: none;
}

.contact-item label, .status-item label {
  font-weight: 500;
  color: #64748b;
  min-width: 140px;
}

.contact-item span, .status-item span {
  color: #1e293b;
  text-align: right;
}

.contact-item a {
  color: #3b82f6;
  text-decoration: none;
}

.contact-item a:hover {
  text-decoration: underline;
}

.contact-edit-form {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.875rem;
}

.stage-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stage-applied { background: #f3f4f6; color: #374151; }
.stage-phone_screen { background: #dbeafe; color: #1d4ed8; }
.stage-technical { background: #fef3c7; color: #d97706; }
.stage-interview { background: #fed7aa; color: #ea580c; }
.stage-final_round { background: #e0e7ff; color: #5b21b6; }
.stage-offer_sent { background: #dcfce7; color: #16a34a; }
.stage-offer_accepted { background: #d1fae5; color: #059669; }
.stage-offer_declined { background: #fecaca; color: #dc2626; }
.stage-hired { background: #d1fae5; color: #059669; }
.stage-rejected { background: #fecaca; color: #dc2626; }
.stage-not_a_fit { background: #f3f4f6; color: #6b7280; }
.stage-withdrawn { background: #fef3c7; color: #92400e; }
.stage-declined { background: #fed7aa; color: #ea580c; }
.stage-disqualified { background: #fee2e2; color: #b91c1c; }

.score-badge {
  padding: 0.25rem 0.75rem;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.score-display {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.stage-dropdown {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.stage-dropdown:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.content-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f5f9;
  margin-top: 2rem;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
  border-radius: 12px 12px 0 0;
}

.tab-button {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tab-button:first-child {
  border-radius: 12px 0 0 0;
}

.tab-button:last-child {
  border-radius: 0 12px 0 0;
}

.tab-button.active {
  background: white;
  color: #3b82f6;
  border-bottom: 2px solid #3b82f6;
}

.tab-button:hover:not(.active) {
  background: #f1f5f9;
  color: #475569;
}

.tab-content {
  padding: 2rem;
}

.content-card {
  width: 100%;
}

.add-note-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-direction: column;
}

.note-textarea {
  width: 100%;
}

.notes-content {
  max-height: 600px;
  overflow-y: auto;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.note-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.note-author {
  font-weight: 600;
  color: #1e293b;
}

.note-date {
  font-size: 0.875rem;
  color: #64748b;
}

.note-delete-btn {
  background: transparent;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.note-delete-btn:hover {
  background: #fee2e2;
}

.note-content {
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
}

.empty-notes {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.empty-notes i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.resume-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  max-height: 600px;
  overflow-y: auto;
}

.resume-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
  margin: 0;
  color: #374151;
}

.analysis-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  max-height: 600px;
  overflow-y: auto;
}

.analysis-section {
  margin-bottom: 2rem;
}

.analysis-section:last-child {
  margin-bottom: 0;
}

.analysis-section h4 {
  color: #1e293b;
  margin-bottom: 1rem;
  font-weight: 600;
}

.markdown-content {
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
  color: #374151;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: #1e293b;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  background: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.markdown-content :deep(th) {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
}

.calendar-card {
  margin-top: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f5f9;
  padding: 1.5rem;
}

.calendar-card .card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.calendar-content {
  padding: 1rem 0;
}

@media (max-width: 768px) {
  .candidate-detail-container {
    padding: 1rem;
  }
  
  .candidate-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .candidate-summary {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .tabs-header {
    flex-direction: column;
  }
  
  .tab-button {
    text-align: left;
    justify-content: flex-start;
  }
}
</style>
