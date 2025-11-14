<template>
  <div class="result-page">
    <div class="header">
      <div class="container">
        <button class="back-btn" @click="closeWindow">
          <i class="fas fa-arrow-left"></i>
          Back
        </button>
        <h1>{{ pageTitle }}</h1>
      </div>
    </div>

    <div class="main-content">
      <div v-if="loading" style="text-align: center; padding: 40px;">
        <n-spin size="large" />
        <p style="margin-top: 20px; color: #64748b;">Loading patent analysis...</p>
      </div>

      <div v-else-if="error" style="text-align: center; padding: 40px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc2626; margin-bottom: 20px;"></i>
        <h3 style="color: #dc2626;">Error Loading Analysis</h3>
        <p style="color: #6b7280;">{{ error }}</p>
      </div>

      <div v-else-if="analysisData" class="cards-grid">
        <!-- Patent Information Card -->
        <div class="card">
          <div class="card-header patent">
            <i class="fas fa-file-alt section-icon"></i>
            Patent Information
          </div>
          <div class="card-content">
            <div class="patent-info-grid">
              <div class="info-item">
                <div class="info-label">Patent Number</div>
                <div class="info-value">{{ analysisData.patent_number || 'N/A' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Title</div>
                <div class="info-value">{{ analysisData.patent_title || 'N/A' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Assignee</div>
                <div class="info-value">{{ analysisData.assignee || 'N/A' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Patent Date</div>
                <div class="info-value">{{ analysisData.patent_date || 'N/A' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Similarity Score</div>
                <div class="info-value">{{ analysisData.similarity_score || 'N/A' }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Patent Content Card -->
        <div class="card">
          <div class="card-header">
            <i class="fas fa-file-text section-icon"></i>
            Patent Content
            <button class="copy-btn" @click="copyContent(analysisData.abstract)">
              <i class="fas fa-copy"></i>
              Copy
            </button>
          </div>
          <div class="card-content">
            <div class="patent-content" v-html="renderMarkdown(analysisData.abstract)"></div>
          </div>
        </div>

        <!-- Similarity Analysis Card -->
        <div class="card">
          <div class="card-header similarity">
            <i class="fas fa-search section-icon"></i>
            Similarity Analysis
            <button class="copy-btn" @click="copyContent(analysisData.similarity_explanation)">
              <i class="fas fa-copy"></i>
              Copy
            </button>
          </div>
          <div class="card-content">
            <div class="markdown-content" v-html="renderMarkdown(analysisData.similarity_explanation)"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { NSpin, useMessage } from 'naive-ui'
import { marked } from 'marked'

const route = useRoute()
const message = useMessage()

const loading = ref(true)
const error = ref('')
const analysisData = ref<any>(null)
const pageTitle = ref('Patent Similarity Analysis')

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true
})

// Helper functions
function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text) as string
}

function closeWindow() {
  window.close()
}

async function copyContent(text: string) {
  if (!text) {
    message.warning('No content to copy')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    message.success('Content copied!')
  } catch (err) {
    message.error('Failed to copy content')
  }
}

// Load patent analysis details
async function loadAnalysisDetails() {
  const analysisId = route.params.analysisId as string
  const patentId = route.params.patentId as string

  try {
    const response = await fetch(
      `https://patent.api.4aitek.com/api/patent-analysis-details/${analysisId}/${patentId}`,
      {
        credentials: 'include'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to load patent analysis details')
    }

    const data = await response.json()

    if (data.success) {
      analysisData.value = data.analysis
      pageTitle.value = 'Patent Analysis - ' + (data.analysis.patent_title || 'Unknown Patent')
      document.title = pageTitle.value
    } else {
      error.value = data.error || 'Analysis not found'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load analysis details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAnalysisDetails()
})
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  background: linear-gradient(135deg, #4A90E2 0%, #4CAF50 100%);
  color: white;
  padding: 20px 0;
  box-shadow: 0 4px 20px rgba(74, 144, 226, 0.3);
  position: relative;
}

.header .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
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
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
  color: white;
  padding: 18px 24px;
  font-size: 1.1em;
  font-weight: 600;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header.similarity {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.card-header.patent {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
}

.card-content {
  padding: 1.5rem;
}

.section-icon {
  font-size: 1.2em;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: #f9fafb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-50%) scale(1.05);
}

.patent-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #3F51B5;
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

.markdown-content,
.patent-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  max-height: 600px;
  overflow-y: auto;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #374151;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.patent-content :deep(h1),
.patent-content :deep(h2),
.patent-content :deep(h3) {
  color: #1e293b;
  margin-top: 24px;
  margin-bottom: 12px;
  font-weight: 600;
}

.markdown-content :deep(p),
.patent-content :deep(p) {
  margin-bottom: 1rem;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol),
.patent-content :deep(ul),
.patent-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 1rem;
}

.markdown-content :deep(strong),
.patent-content :deep(strong) {
  color: #1e293b;
  font-weight: 600;
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 15px;
  }

  .card-header {
    padding: 16px 20px;
    font-size: 1rem;
  }

  .patent-info-grid {
    grid-template-columns: 1fr;
  }

  .copy-btn {
    position: static;
    transform: none;
    margin-top: 12px;
  }
}
</style>

