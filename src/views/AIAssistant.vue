<template>
  <div class="ai-talent-container">
    <!-- AI assistant notice -->
    <div class="ai-assistant-notice">
      <p>By default, the AI assistant reviews up to the top 20 scored resumes per project. Need more control? Upgrade to our Enterprise plan to customize your resume screening.</p>
    </div>
    
    <div class="projects-table-container">
      <div class="table-wrapper">
        <n-spin :show="loading">
          <template v-if="projects.length > 0">
            <table class="projects-table" id="projects-table">
              <thead>
                <tr>
                  <th style="min-width: 50px; white-space: pre-line;">ChatAI</th>
                  <th @click="sortTable(1)" class="sortable">Project Name</th>
                  <th @click="sortTable(2)" class="sortable">Company</th>
                  <th @click="sortTable(3)" class="sortable">Position</th>
                  <th @click="sortTable(4)" class="sortable" style="min-width:40px;max-width:60px;"># Resumes</th>
                  <th @click="sortTable(5)" class="sortable" style="min-width:40px;max-width:60px;"># Analyses</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="project in projects" :key="project.project_id">
                  <td class="link-cell">
                    <router-link 
                      :to="`/chatflow?project_id=${project.project_id}`" 
                      class="cell-link analysis" 
                      title="Chat with AI Assistant"
                    >
                      <i class="fas fa-robot"></i>
                    </router-link>
                  </td>
                  <td :title="project.project_name">{{ project.project_name }}</td>
                  <td :title="project.company">{{ project.company }}</td>
                  <td :title="project.position_title">{{ project.position_title }}</td>
                  <td style="min-width:40px;max-width:60px;text-align:center;font-weight:600;">{{ project.resume_count || 0 }}</td>
                  <td style="min-width:40px;max-width:60px;text-align:center;font-weight:600;">{{ project.analysis_count || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </template>
          <template v-else>
            <div class="no-projects">
              <i class="fas fa-robot"></i>
              <h3>No Projects Found</h3>
              <p>There are no projects available for AI assistant analysis.</p>
            </div>
          </template>
        </n-spin>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NSpin, useMessage } from 'naive-ui'
import { config } from '@/config'
import api from '@/utils/api'

const message = useMessage()

interface Project {
  project_id: number
  project_name: string
  company: string
  position_title: string
  total_resumes: number
  resume_count?: number
  analysis_count?: number
}

const projects = ref<Project[]>([])
const loading = ref(true)

onMounted(async () => {
  await loadProjects()
})

async function loadProjects() {
  loading.value = true
  try {
    const response = await api.get(`${config.talentApiUrl}/projects`)
    const data = response.data
    
    if (data.success) {
      // Get analysis counts for each project
      projects.value = await Promise.all(data.projects.map(async (project: Project) => {
        try {
          const resumesRes = await api.get(`${config.talentApiUrl}/projects/${project.project_id}/resumes`)
          const resumesData = resumesRes.data
          
          const resumeCount = resumesData.resumes?.length || 0
          const analysisCount = resumesData.resumes?.filter((r: any) => r.analysis_status === 'completed').length || 0
          
          return {
            ...project,
            resume_count: resumeCount,
            analysis_count: analysisCount
          }
        } catch {
          return {
            ...project,
            resume_count: 0,
            analysis_count: 0
          }
        }
      }))
    }
  } catch (error: any) {
    // Don't show error for 401 - interceptor handles it
    if (error?.response?.status === 401) {
      return
    }
    console.error('Error loading projects:', error)
    message.error('Failed to load projects')
  } finally {
    loading.value = false
  }
}

function sortTable(columnIndex: number) {
  const headers = ['', 'project_name', 'company', 'position_title', 'resume_count', 'analysis_count']
  const key = headers[columnIndex] as keyof Project
  
  // Toggle sort direction
  const currentSort = (projects.value as any)._sortKey
  const currentDir = (projects.value as any)._sortDir
  
  let ascending = true
  if (currentSort === key && currentDir === 'asc') {
    ascending = false
  }
  
  // Sort
  projects.value.sort((a, b) => {
    let aVal = a[key]
    let bVal = b[key]
    
    // Handle null/undefined
    if (aVal === null || aVal === undefined) return ascending ? 1 : -1
    if (bVal === null || bVal === undefined) return ascending ? -1 : 1
    
    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return ascending ? aVal - bVal : bVal - aVal
    }
    
    // String comparison
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    return ascending ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
  })
  
  // Store sort state
  ;(projects.value as any)._sortKey = key
  ;(projects.value as any)._sortDir = ascending ? 'asc' : 'desc'
}
</script>

<style scoped>
.ai-talent-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 5px;
}

.ai-assistant-notice {
  margin-bottom: 15px;
  text-align: center;
}

.ai-assistant-notice p {
  font-size: 0.85em;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.projects-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  overflow: hidden;
  border: 1px solid #e9ecef;
  margin-top: 5px;
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
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(67, 233, 123, 0.06);
  font-size: 0.95em;
}

.projects-table th,
.projects-table td {
  border: 1px solid #e3e8ee;
  border-collapse: collapse;
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
  border-right: 1px solid #e3e8ee;
}

.projects-table th {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  font-size: 0.95em;
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: pre-line;
  border-bottom: 2px solid #e2e8f0;
  border-top: 1px solid #e2e8f0;
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
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
  color: white;
}

.projects-table tbody tr td:nth-child(1) .cell-link i {
  color: white !important;
  opacity: 0.9;
}

.projects-table tbody tr td:nth-child(1) .cell-link:hover i {
  color: white !important;
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

.projects-table td {
  background: #fff;
  color: #222e3a;
  border-bottom: 1px solid #e3e8ee;
  vertical-align: middle;
  line-height: 1;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.projects-table tr:hover td {
  background: #f8f9fa;
}

.projects-table tbody tr:hover td:nth-child(1) {
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
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
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
}

.cell-link.analysis {
  background: transparent;
  border: none;
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

.cell-link:hover {
  background: transparent;
  border: none;
  transform: none;
  box-shadow: none;
}

.cell-link:hover i {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.3);
  color: #1e293b;
}

.no-projects {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
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
</style>

