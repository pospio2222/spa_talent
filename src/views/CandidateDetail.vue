<template>
  <div class="hiretrac-candidate-detail">
    <n-spin :show="loading">
      <!-- Candidate Header -->
      <div class="candidate-header">
        <div class="candidate-info">
          <div class="candidate-breadcrumb">
            <router-link to="/candidates"><i class="fas fa-users"></i> Manage Candidates</router-link>
            <span> / </span>
            <router-link :to="`/project/${projectId}/candidates`">{{candidate?.project_name || 'Project'}}</router-link>
            <span> / {{ candidate?.name || 'Candidate Details' }}</span>
          </div>
          <h1>{{ candidate?.name || 'Unknown Candidate' }}</h1>
          <div class="candidate-meta">
            <span class="position">{{ candidate?.position_title }}</span>
            <span class="company">{{ candidate?.company }}</span>
          </div>
        </div>
        <div class="candidate-actions">
          <n-button secondary @click="$router.push(`/project/${projectId}/candidates`)">
            <i class="fas fa-arrow-left"></i> Back to Candidates
          </n-button>
        </div>
      </div>

      <!-- Candidate Summary -->
      <div class="candidate-summary">
        <div class="summary-card">
          <div class="card-header">
            <h3><i class="fas fa-user"></i> Contact Information</h3>
          </div>
          <div class="contact-info">
            <div class="contact-item">
              <label>Email:</label>
              <span>{{ candidate?.email || 'Not provided' }}</span>
            </div>
            <div class="contact-item">
              <label>Phone:</label>
              <span>{{ candidate?.phone || 'Not provided' }}</span>
            </div>
            <div class="contact-item">
              <label>Location:</label>
              <span>{{ candidate?.location || 'Not provided' }}</span>
            </div>
            <div class="contact-item">
              <label>LinkedIn:</label>
              <span>
                <a v-if="candidate?.linkedin_url" :href="candidate.linkedin_url" target="_blank">
                  {{ candidate.linkedin_url }}
                </a>
                <template v-else>Not provided</template>
              </span>
            </div>
            <div class="contact-item">
              <label>Current Company:</label>
              <span>{{ candidate?.current_company || 'Not provided' }}</span>
            </div>
            <div class="contact-item">
              <label>Experience Years:</label>
              <span>{{ candidate?.experience_years || 'Not provided' }}</span>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-header">
            <h3><i class="fas fa-chart-pie"></i> Status & Progress</h3>
          </div>
          <div class="status-info">
            <div class="status-item">
              <label>Current Stage:</label>
              <span :class="['stage-badge', `stage-${candidate?.current_stage}`]">
                {{ formatStage(candidate?.current_stage) }}
              </span>
            </div>
            <div class="status-item">
              <label>Analysis Score:</label>
              <span class="score-badge">{{ candidate?.analysis_score || 'N/A' }}</span>
            </div>
            <div class="status-item">
              <label>Last Updated:</label>
              <span>{{ candidate?.stage_updated_at_str || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content-container">
        <div class="content-tabs">
          <div class="tabs-header">
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

          <!-- Resume Tab -->
          <div v-if="activeTab === 'resume'" class="tab-content active">
            <div class="content-card">
              <div class="card-header">
                <h3><i class="fas fa-file-alt"></i> Resume Content</h3>
              </div>
              <div v-if="candidate?.resume_str" class="resume-content">
                <pre>{{ candidate.resume_str }}</pre>
              </div>
              <p v-else>No resume content available for this candidate.</p>
            </div>
          </div>

          <!-- Analysis Tab -->
          <div v-if="activeTab === 'analysis'" class="tab-content active">
            <div class="content-card">
              <div class="card-header">
                <h3><i class="fas fa-chart-pie"></i> Analysis Report</h3>
                <div class="header-actions">
                  <span class="score-display">Score: {{ candidate?.analysis_score || 'N/A' }}</span>
                  <n-button
                    v-if="candidate?.descriptive_str || candidate?.tabular_str"
                    secondary
                    size="small"
                    @click="copyAnalysis"
                  >
                    <i class="fas fa-copy"></i> Copy
                  </n-button>
                </div>
              </div>
              <div v-if="candidate?.descriptive_html || candidate?.tabular_html" class="analysis-content">
                <div v-if="candidate?.descriptive_html" class="analysis-section">
                  <h4>Analysis Summary</h4>
                  <div class="markdown-content" v-html="candidate.descriptive_html"></div>
                </div>
                
                <div v-if="candidate?.tabular_html" class="analysis-section">
                  <h4>Detailed Breakdown</h4>
                  <div class="markdown-content" v-html="candidate.tabular_html"></div>
                </div>
              </div>
              <p v-else>No analysis available for this candidate.</p>
            </div>
          </div>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NSpin, useMessage } from 'naive-ui'

const route = useRoute()
const message = useMessage()

const resumeId = computed(() => Number(route.params.resumeId))
const projectId = computed(() => Number(route.params.projectId))

const candidate = ref<any>(null)
const loading = ref(true)
const activeTab = ref('resume')

onMounted(async () => {
  await loadCandidateDetail()
  loading.value = false
})

async function loadCandidateDetail() {
  try {
    const response = await fetch(
      `https://talent.api.4aitek.com/candidate/${resumeId.value}/${projectId.value}`,
      { credentials: 'include' }
    )
    const data = await response.json()
    
    if (data.success) {
      candidate.value = data.candidate
    } else {
      throw new Error(data.error || 'Failed to load candidate')
    }
  } catch (error: any) {
    console.error('Error loading candidate:', error)
    message.error('Failed to load candidate details')
  }
}

function formatStage(stage: string | undefined): string {
  if (!stage) return 'N/A'
  return stage.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function copyAnalysis() {
  let analysisText = ''
  
  if (candidate.value?.descriptive_str) {
    analysisText += '# Analysis Summary\n\n' + candidate.value.descriptive_str + '\n\n'
  }
  
  if (candidate.value?.tabular_str) {
    analysisText += '# Detailed Breakdown\n\n' + candidate.value.tabular_str
  }
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(analysisText).then(() => {
      message.success('Analysis copied to clipboard!')
    }).catch(() => {
      message.error('Copy failed')
    })
  } else {
    message.error('Copy not supported')
  }
}
</script>

<style scoped>
.hiretrac-candidate-detail {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Candidate Header */
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

/* Summary Cards */
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
  min-width: 120px;
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

/* Stage and Score Badges */
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

/* Content Tabs */
.content-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f5f9;
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

/* Resume Content */
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

/* Analysis Content */
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

.markdown-content :deep(h1:first-child),
.markdown-content :deep(h2:first-child),
.markdown-content :deep(h3:first-child),
.markdown-content :deep(h4:first-child),
.markdown-content :deep(h5:first-child),
.markdown-content :deep(h6:first-child) {
  margin-top: 0;
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
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

.markdown-content :deep(tr:last-child td) {
  border-bottom: none;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #1e293b;
}

.markdown-content :deep(code) {
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6b7280;
  font-style: italic;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hiretrac-candidate-detail {
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
