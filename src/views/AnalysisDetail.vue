<template>
  <div class="analysis-detail-container">
    <div class="header">
      <div class="header-content">
        <h1>{{ pageTitle }}</h1>
        <n-button @click="goBack" class="back-btn-header">
          <template #icon>
            <n-icon><ArrowBackOutline /></n-icon>
          </template>
          Back
        </n-button>
      </div>
    </div>

    <div class="main-content">
      <n-spin :show="isLoading" size="large">
        <div v-if="analysis" class="cards-grid">
          <!-- Project Information Card -->
          <div class="card">
            <div class="card-header">
              <n-icon :component="InformationCircleOutline" class="section-icon" />
              <span>Project Information</span>
            </div>
            <div class="card-content">
              <div class="project-info-grid">
                <div class="info-item">
                  <div class="info-label">Project Name</div>
                  <div class="info-value">{{ analysis.project_name || 'N/A' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Company</div>
                  <div class="info-value">{{ analysis.company || 'N/A' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Position Category</div>
                  <div class="info-value">{{ analysis.position_category || 'N/A' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Position Title</div>
                  <div class="info-value">{{ analysis.position_title || 'N/A' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Description</div>
                  <div class="info-value">{{ analysis.description || 'N/A' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Resume Content Card -->
          <div class="card">
            <div class="card-header">
              <n-icon :component="DocumentTextOutline" class="section-icon" />
              <span>Resume Content</span>
            </div>
            <div class="card-content">
              <div class="resume-content">
                <pre>{{ analysis.resume_str || 'Resume content not available' }}</pre>
              </div>
            </div>
          </div>

          <!-- Itemized Analysis Card -->
          <div class="card">
            <div class="card-header itemized">
              <n-icon :component="GridOutline" class="section-icon" />
              <span>Itemized Analysis</span>
              <button class="copy-btn" @click="copyContent(analysis.tabular_str)">
                <n-icon><CopyOutline /></n-icon>
                Copy
              </button>
            </div>
            <div class="card-content">
              <div class="markdown-content" v-html="renderMarkdown(analysis.tabular_str)"></div>
            </div>
          </div>

          <!-- Descriptive Analysis Card -->
          <div class="card">
            <div class="card-header descriptive">
              <n-icon :component="ReaderOutline" class="section-icon" />
              <span>Descriptive Analysis</span>
              <button class="copy-btn" @click="copyContent(analysis.descriptive_str)">
                <n-icon><CopyOutline /></n-icon>
                Copy
              </button>
            </div>
            <div class="card-content">
              <div class="markdown-content" v-html="renderMarkdown(analysis.descriptive_str)"></div>
            </div>
          </div>
        </div>

        <div v-else-if="!isLoading && error" class="error-container">
          <n-icon :component="WarningOutline" size="64" color="#dc3545" />
          <h2>Error Loading Analysis</h2>
          <p>{{ error }}</p>
          <n-button type="primary" @click="goBack">Go Back</n-button>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NSpin, NButton, NIcon, useMessage } from 'naive-ui'
import { 
  ArrowBackOutline, InformationCircleOutline, DocumentTextOutline, 
  GridOutline, ReaderOutline, CopyOutline, WarningOutline 
} from '@vicons/ionicons5'
import { marked } from 'marked'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const message = useMessage()

interface Analysis {
  analysis_id: number
  project_id: number
  resume_id: number
  analysis_score: number | null
  descriptive_str: string | null
  tabular_str: string | null
  analysis_status: string
  error_message: string | null
  processing_time_seconds: number | null
  llm_model_used: string | null
  analyzed_by: number | null
  created_at: string
  updated_at: string
  filename: string
  resume_str: string | null
  project_name: string
  company: string | null
  position_category: string | null
  position_title: string | null
  description: string | null
  jd_str: string | null
  cultural_fit_str: string | null
}

const analysisId = computed(() => route.params.analysisId as string)

const analysis = ref<Analysis | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const pageTitle = computed(() => {
  if (analysis.value) {
    return `Analysis Details - ${analysis.value.filename}`
  }
  return 'Analysis Details'
})

function renderMarkdown(content: string | null): string {
  if (!content) return '<p>Content not available</p>'
  
  try {
    // Configure marked to support tables
    marked.setOptions({
      breaks: true,
      gfm: true
    })
    return marked.parse(content) as string
  } catch (e) {
    console.error('Error rendering markdown:', e)
    return `<pre>${content}</pre>`
  }
}

async function loadAnalysisDetails() {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await api.get(`https://talent.api.4aitek.com/analysis/${analysisId.value}`)
    const data = response.data
    
    if (data.success) {
      analysis.value = data.analysis
    } else {
      error.value = 'Failed to load analysis details'
    }
  } catch (err: any) {
    console.error('Error loading analysis:', err)
    error.value = err.message || 'An error occurred while loading analysis details'
  } finally {
    isLoading.value = false
  }
}

async function copyContent(content: string | null) {
  if (!content) {
    message.warning('No content to copy')
    return
  }
  
  try {
    await navigator.clipboard.writeText(content)
    message.success('Markdown copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
    message.error('Failed to copy to clipboard')
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadAnalysisDetails()
})
</script>

<style scoped>
.analysis-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.header {
  background: linear-gradient(135deg, #4A90E2 0%, #4CAF50 100%);
  color: white;
  padding: 20px 0;
  box-shadow: 0 4px 20px rgba(74, 144, 226, 0.3);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.back-btn-header {
  background: white;
  color: #4A90E2;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.cards-grid {
  display: grid;
  gap: 25px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.card-header {
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  color: white;
  padding: 18px 24px;
  font-size: 1.1em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.card-header.itemized {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.card-header.descriptive {
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
}

.card-content {
  padding: 1.5rem;
}

.project-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #00d4ff;
  transition: all 0.2s ease;
}

.info-item:hover {
  background: #f1f5f9;
  transform: translateX(2px);
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
}

.info-value {
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 500;
}

.resume-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  max-height: 600px;
  overflow-y: auto;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #374151;
}

.resume-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
  margin: 0;
  color: #374151;
}

.markdown-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  max-height: 600px;
  overflow-y: auto;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.95rem;
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
  margin-top: 24px;
  margin-bottom: 12px;
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
  padding-left: 20px;
  margin-bottom: 1rem;
}

.markdown-content :deep(li) {
  margin-bottom: 8px;
}

.markdown-content :deep(strong) {
  color: #1e293b;
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
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.markdown-content :deep(th) {
  background: #f1f5f9;
  font-weight: 600;
  color: #1e293b;
}

.markdown-content :deep(tr:hover) {
  background: #f8fafc;
}

.copy-btn {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  background: white;
  color: #374151;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: #f9fafb;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-50%) scale(1.05);
}

.copy-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.section-icon {
  font-size: 1.2em;
}

.error-container {
  text-align: center;
  padding: 60px 20px;
  color: #757575;
}

.error-container h2 {
  font-size: 1.8rem;
  color: #424242;
  margin: 20px 0 10px;
}

.error-container p {
  font-size: 1.1rem;
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 15px;
  }
  
  .card-header {
    padding: 16px 20px;
    font-size: 1rem;
  }
  
  .card-content {
    padding: 20px;
  }
  
  .project-info-grid {
    grid-template-columns: 1fr;
  }
  
  .copy-btn {
    position: static;
    transform: none;
    margin-top: 12px;
    align-self: flex-start;
  }
  
  .copy-btn:hover {
    transform: scale(1.05);
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header h1 {
    font-size: 1.5rem;
  }
}
</style>

