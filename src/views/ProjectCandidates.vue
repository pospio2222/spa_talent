<template>
  <div class="candidates-container">
    <PageBanner :title="`Candidates - ${projectName}`" />
    
    <div class="content-wrapper">
      <n-card>
        <div class="actions-bar">
          <n-button @click="$router.push('/projects')">
            <i class="fas fa-arrow-left"></i> Back to Projects
          </n-button>
          <n-button @click="$router.push('/upload')" type="primary">
            <i class="fas fa-upload"></i> Upload Resumes
          </n-button>
          <n-button @click="extractInfo" :loading="isExtracting">
            <i class="fas fa-magic"></i> Extract AI Info
          </n-button>
        </div>

        <n-spin :show="isLoading">
          <div v-if="candidates.length === 0" class="empty-state">
            <i class="fas fa-user-circle"></i>
            <p>No candidates yet. Upload resumes to get started!</p>
          </div>

          <div v-else class="candidates-table">
            <n-data-table
              :columns="columns"
              :data="candidates"
              :pagination="pagination"
              :row-props="rowProps"
            />
          </div>
        </n-spin>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NSpin, NDataTable, NTag, useMessage } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const projectId = computed(() => route.params.projectId as string)
const projectName = ref('')
const candidates = ref<any[]>([])
const isLoading = ref(false)
const isExtracting = ref(false)

const pagination = ref({
  pageSize: 20
})

const columns = [
  {
    title: 'Name',
    key: 'filename',
    render: (row: any) => {
      const name = row.filename.replace(/\.(pdf|docx?|txt)$/i, '')
      return h('span', { class: 'candidate-name' }, name)
    }
  },
  {
    title: 'Status',
    key: 'status',
    render: (row: any) => {
      const status = row.candidate_status?.status || 'new'
      const typeMap: any = {
        new: 'default',
        screening: 'info',
        interviewing: 'warning',
        offer: 'success',
        rejected: 'error'
      }
      return h(NTag, { type: typeMap[status] || 'default' }, { default: () => status.toUpperCase() })
    }
  },
  {
    title: 'Email',
    key: 'email',
    render: (row: any) => row.candidate_status?.email || '-'
  },
  {
    title: 'Phone',
    key: 'phone',
    render: (row: any) => row.candidate_status?.phone || '-'
  },
  {
    title: 'Relevance Score',
    key: 'relevance_score',
    render: (row: any) => {
      const score = row.candidate_status?.relevance_score
      if (!score) return '-'
      return h('span', { class: 'score' }, `${(score * 100).toFixed(0)}%`)
    }
  }
]

function rowProps(row: any) {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      router.push(`/candidate/${row.resume_id}/${projectId.value}`)
    }
  }
}

async function loadCandidates() {
  isLoading.value = true
  try {
    const response = await fetch(`https://talent.api.4aitek.com/projects/${projectId.value}/candidates`, {
      credentials: 'include'
    })
    
    const data = await response.json()
    if (data.success) {
      candidates.value = data.candidates
      projectName.value = data.project_name
    }
  } catch (error: any) {
    console.error('Error loading candidates:', error)
    message.error('Failed to load candidates')
  } finally {
    isLoading.value = false
  }
}

async function extractInfo() {
  isExtracting.value = true
  try {
    const response = await fetch(`https://talent.api.4aitek.com/projects/${projectId.value}/extract-info`, {
      method: 'POST',
      credentials: 'include'
    })
    
    const data = await response.json()
    if (data.success) {
      message.success(data.message || 'Extraction started')
      setTimeout(() => loadCandidates(), 3000)
    }
  } catch (error: any) {
    console.error('Error extracting info:', error)
    message.error('Failed to start extraction')
  } finally {
    isExtracting.value = false
  }
}

onMounted(() => {
  loadCandidates()
})
</script>

<style scoped>
.candidates-container {
  min-height: calc(100vh - 60px);
  background: #f8f9fa;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.actions-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
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

.candidate-name {
  font-weight: 500;
  color: #2d3748;
}

.score {
  font-weight: 600;
  color: #667eea;
}
</style>

