<template>
  <div class="console-container">
    <PageBanner title="Talent AI Console" />
    
    <div class="content-wrapper">
      <n-card title="Welcome to Talent AI" class="welcome-card">
        <p>AI-Powered Talent Acquisition and Candidate Intelligence Platform</p>
        <p class="subtitle">Manage recruiting projects, track candidates, and leverage AI insights</p>
      </n-card>

      <div class="tools-grid">
        <!-- Recruiting Projects -->
        <n-card hoverable class="tool-card" @click="$router.push('/projects')">
          <div class="tool-icon">
            <i class="fas fa-briefcase"></i>
          </div>
          <h3>Recruiting Projects</h3>
          <p>Create and manage recruiting projects, define job requirements, and organize candidates</p>
        </n-card>

        <!-- Candidate Dashboard -->
        <n-card hoverable class="tool-card" @click="$router.push('/candidates')">
          <div class="tool-icon">
            <i class="fas fa-users"></i>
          </div>
          <h3>Candidate Dashboard</h3>
          <p>View, track, and evaluate candidates with AI-powered insights and scoring</p>
        </n-card>

        <!-- AI Assistant -->
        <n-card hoverable class="tool-card" @click="$router.push('/ai-assistant')">
          <div class="tool-icon">
            <i class="fas fa-robot"></i>
          </div>
          <h3>AI Assistant</h3>
          <p>Ask questions about candidates, get recruitment insights, and receive AI-powered recommendations</p>
        </n-card>

        <!-- Upload Resumes -->
        <n-card hoverable class="tool-card" @click="$router.push('/upload')">
          <div class="tool-icon">
            <i class="fas fa-cloud-upload-alt"></i>
          </div>
          <h3>Upload Resumes</h3>
          <p>Bulk upload candidate resumes and automatically extract key information</p>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NCard } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'
</script>

<style scoped>
.console-container {
  min-height: calc(100vh - 60px);
  background: #f8f9fa;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.welcome-card {
  margin-bottom: 30px;
  text-align: center;
}

.welcome-card p {
  font-size: 1.1em;
  color: #4a5568;
  margin: 10px 0;
}

.welcome-card .subtitle {
  font-size: 0.95em;
  color: #718096;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.tool-card {
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  padding: 20px;
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.tool-icon {
  font-size: 3em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 15px;
}

.tool-card h3 {
  color: #2d3748;
  margin: 15px 0 10px;
  font-size: 1.3em;
}

.tool-card p {
  color: #718096;
  font-size: 0.95em;
  line-height: 1.5;
}
</style>
