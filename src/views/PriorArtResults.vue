<template>
  <div class="page-container">
    <PageBanner
      title="Prior Art Search Results"
      subtitle="USPTO Patent Analysis Results"
      :show-credits="false"
    />

    <div class="content-wrapper">
      <div v-if="loading" style="text-align: center; padding: 40px;">
        <n-spin size="large" />
        <p style="margin-top: 20px; color: #64748b;">Loading analysis results...</p>
      </div>

      <div v-else-if="error" class="no-results">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 20px;"></i>
        <h3>Error Loading Results</h3>
        <p>{{ error }}</p>
        <n-button type="primary" @click="router.push('/prior-art')">
          Back to Search
        </n-button>
      </div>

      <div v-else-if="analysisData" class="results-container">
        <!-- Analysis Summary -->
        <div class="analysis-summary">
          <div v-if="analysisData.analysis_summary" style="margin-top: 10px;">
            <div class="summary-value">{{ analysisData.analysis_summary }}</div>
          </div>
          <div v-if="analysisData.keywords && analysisData.keywords.length > 0" class="keywords-section">
            <div class="summary-label">Keywords: </div>
            <div class="summary-value">{{ analysisData.keywords.join(', ') }}</div>
          </div>
        </div>

        <!-- Patents Table -->
        <div v-if="patents.length > 0" class="patents-section">
          <table class="patents-table">
            <thead>
              <tr>
                <th style="width: 40%;">Patent Information</th>
                <th style="width: 35%;">Abstract</th>
                <th style="width: 10%;">Preliminary Match</th>
                <th style="width: 10%;">Similarity Score</th>
                <th style="width: 13%;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="patent in patents" :key="patent.uspto_id">
                <td>
                  <div class="patent-title">{{ truncate(patent.title, 100) }}</div>
                  <a
                    v-if="patent.google_patents_url"
                    :href="patent.google_patents_url"
                    target="_blank"
                    rel="noopener"
                    class="patent-link"
                  >
                    <i class="fas fa-external-link-alt"></i> Google Patents
                  </a>
                </td>
                <td>
                  <div v-if="patent.abstract" class="patent-abstract">
                    {{ truncate(patent.abstract, 200) }}
                  </div>
                </td>
                <td>
                  <div
                    class="similarity-score"
                    :class="getScoreClass(patent.vector_score)"
                  >
                    {{ patent.vector_score }}
                  </div>
                </td>
                <td>
                  <div
                    v-if="patent.similarity_score !== null && patent.similarity_score !== undefined"
                    :id="`score-${patent.uspto_id}`"
                    class="similarity-score"
                    :class="getScoreClass(patent.similarity_score)"
                  >
                    {{ patent.similarity_score }}%
                  </div>
                  <div v-else :id="`score-${patent.uspto_id}`">-</div>
                </td>
                <td>
                  <!-- View Button -->
                  <n-button
                    v-if="patent.similarity_score && patent.similarity_score > 0"
                    size="small"
                    class="btn-view"
                    @click="viewSimilarityAnalysis(patent.uspto_id)"
                  >
                    <i class="fas fa-search"></i> View
                  </n-button>

                  <!-- Retry Button -->
                  <n-button
                    v-else-if="patent.similarity_score === -1"
                    size="small"
                    class="run-btn error"
                    :id="`btn-${patent.uspto_id}`"
                    @click="runSimilarityAnalysis(patent.uspto_id)"
                    title="Analysis failed. Click to retry."
                  >
                    <i class="fas fa-exclamation-triangle"></i> Retry
                  </n-button>

                  <!-- Processing Button -->
                  <n-button
                    v-else-if="isProcessing(patent.uspto_id)"
                    size="small"
                    class="processing-btn"
                    :id="`btn-${patent.uspto_id}`"
                    disabled
                  >
                    <i class="fas fa-spinner fa-spin"></i> Processing...
                  </n-button>

                  <!-- Run Button -->
                  <n-button
                    v-else
                    size="small"
                    class="run-btn"
                    :id="`btn-${patent.uspto_id}`"
                    @click="runSimilarityAnalysis(patent.uspto_id)"
                  >
                    <i class="fas fa-play"></i> Run
                  </n-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- No Results -->
        <div v-else class="no-results">
          <i class="fas fa-search" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 20px;"></i>
          <h3>No Patents Found</h3>
          <p>No relevant patents were found for your invention disclosure.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NButton, NSpin, useMessage } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const loading = ref(true)
const error = ref('')
const analysisData = ref<any>(null)
const patents = ref<any[]>([])
const processingPatents = ref<Set<number>>(new Set())
let pollInterval: number | null = null

// Helper functions
function truncate(text: string, length: number): string {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

function getScoreClass(score: number): string {
  if (score >= 70) return 'score-high'
  if (score >= 40) return 'score-medium'
  return 'score-low'
}

function isProcessing(usptoId: number): boolean {
  return processingPatents.value.has(usptoId)
}

// Load analysis results
async function loadAnalysisResults() {
  const analysisId = route.params.analysisId as string
  
  try {
    const response = await fetch(`https://patent.api.4aitek.com/prior-art-results/${analysisId}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Failed to load analysis results')
    }

    const data = await response.json()

    if (data.success) {
      analysisData.value = data.analysis
      patents.value = data.patents || []
      
      // Check for processing patents
      patents.value.forEach(patent => {
        if (patent.analyzed_at && new Date(patent.analyzed_at).getFullYear() === 1970) {
          processingPatents.value.add(patent.uspto_id)
        }
      })
      
      // Start polling if there are processing patents
      if (processingPatents.value.size > 0) {
        startPolling()
      }
    } else {
      error.value = 'Analysis not found or access denied'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load analysis results'
  } finally {
    loading.value = false
  }
}

// Run similarity analysis
async function runSimilarityAnalysis(usptoId: number) {
  const analysisId = route.params.analysisId as string
  processingPatents.value.add(usptoId)
  
  // Start polling if not already started
  if (!pollInterval) {
    startPolling()
  }

  try {
    const response = await fetch(
      `https://patent.api.4aitek.com/api/run-similarity-analysis/${analysisId}/${usptoId}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }
    )

    const data = await response.json()

    if (!data.success) {
      processingPatents.value.delete(usptoId)
      message.error('Error running similarity analysis: ' + (data.error || 'Unknown error'))
    }
  } catch (err: any) {
    processingPatents.value.delete(usptoId)
    message.error('Error running similarity analysis: ' + (err.message || 'Network error'))
  }
}

// Check patent status
async function checkPatentStatus(usptoId: number) {
  const analysisId = route.params.analysisId as string

  try {
    const response = await fetch(
      `https://patent.api.4aitek.com/api/patent-analysis-status/${analysisId}/${usptoId}`,
      {
        credentials: 'include'
      }
    )

    const data = await response.json()

    if (data.success) {
      if (data.status === 'completed') {
        // Update patent in list
        processingPatents.value.delete(usptoId)
        await updatePatentScore(usptoId, data.similarity_score)
      } else if (data.status === 'not_started') {
        // Analysis failed or reset
        processingPatents.value.delete(usptoId)
      }
      // If 'processing', keep current state
    }
  } catch (err) {
    console.error('Error checking patent status:', err)
  }
}

// Update patent score
async function updatePatentScore(usptoId: number, score: number) {
  const patent = patents.value.find(p => p.uspto_id === usptoId)
  if (patent) {
    patent.similarity_score = score
  }
}

// Start polling for processing patents
function startPolling() {
  if (pollInterval) return

  pollInterval = window.setInterval(() => {
    if (processingPatents.value.size === 0) {
      stopPolling()
      return
    }

    processingPatents.value.forEach(usptoId => {
      checkPatentStatus(usptoId)
    })
  }, 5000) // Poll every 5 seconds
}

// Stop polling
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// View similarity analysis
function viewSimilarityAnalysis(usptoId: number) {
  const analysisId = route.params.analysisId as string
  const url = `/prior-art-result/${analysisId}/${usptoId}`
  window.open(url, '_blank')
}

// Lifecycle
onMounted(() => {
  loadAnalysisResults()
})

onUnmounted(() => {
  stopPolling()
})
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

.results-container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-top: 20px;
  padding: 30px;
}

.analysis-summary {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  border: 1px solid #e2e8f0;
}

.summary-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 1.1rem;
  color: #1e293b;
  font-weight: 500;
}

.keywords-section {
  margin-top: 20px;
}

.patents-section {
  margin-top: 30px;
}

.patents-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.patents-table thead {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.patents-table th {
  padding: 15px 20px;
  text-align: left;
  font-weight: 600;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.9rem;
}

.patents-table td {
  padding: 15px 20px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.patents-table tbody tr:hover {
  background: #f8fafc;
}

.patents-table tbody tr:last-child td {
  border-bottom: none;
}

.patent-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 5px;
  font-size: 1rem;
  line-height: 1.3;
}

.patent-link {
  color: #3F51B5;
  text-decoration: none;
  font-size: 0.85rem;
  margin-top: 5px;
  display: inline-block;
}

.patent-link:hover {
  text-decoration: underline;
}

.patent-abstract {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.similarity-score {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  color: white;
  min-width: 60px;
}

.score-high {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.score-medium {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.score-low {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.run-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: white !important;
}

.run-btn.error {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
}

.btn-view {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%) !important;
  color: white !important;
}

.processing-btn {
  background: #9ca3af !important;
  color: white !important;
  cursor: not-allowed !important;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

@media (max-width: 768px) {
  .results-container {
    padding: 20px;
  }

  .patents-table {
    font-size: 0.85rem;
  }

  .patents-table th,
  .patents-table td {
    padding: 10px 12px;
  }
}
</style>

