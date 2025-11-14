<template>
  <div class="page-container">
    <PageBanner
      title="Information"
      subtitle="Your AI-powered talent intelligence platform"
      :show-credits="false"
    />

    <div class="content-wrapper">
      <n-card class="content-card">
        <div class="section-header">
          <h2><i class="fas fa-coins"></i> AI Credit Usage</h2>
          <p>Understanding how credits are consumed across platform features</p>
        </div>

        <div class="credits-info">
          <p><strong>AI credits are consumed when the Service executes AI-enabled features.</strong> Below is a breakdown of common actions and their credit costs.</p>
          <p class="credits-disclaimer"><strong>Note:</strong> If the system detects an identical document and project information pair from a previous analysis, it will load the saved result instead of running a new one (unless override analysis button is activated) — <strong>NO AI credits will be consumed</strong>.</p>
          
          <n-table :bordered="false" :single-line="false" class="credits-table">
            <thead>
              <tr>
                <th>Action / Feature</th>
                <th>Credits Used</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="feature-info">
                    <i class="fas fa-file-alt"></i>
                    <span>Analyze a single resume</span>
                  </div>
                </td>
                <td><strong>1</strong> credit</td>
                <td>Runs the resume through the AI analysis pipeline (AI analysis of skills, experience, fit).</td>
              </tr>
              <tr>
                <td>
                  <div class="feature-info">
                    <i class="fas fa-comments"></i>
                    <span>Ask one question to the AI chat</span>
                  </div>
                </td>
                <td><strong>1</strong> credit</td>
                <td>One conversational turn or question/query to the AI chat assistant (AI generated response).</td>
              </tr>
              <tr>
                <td>
                  <div class="feature-info">
                    <i class="fas fa-user-plus"></i>
                    <span>Migrate one resume to manage candidate list</span>
                  </div>
                </td>
                <td><strong>1</strong> credit</td>
                <td>Moves/imports a resume into the candidate management system (AI extraction of key information).</td>
              </tr>
            </tbody>
          </n-table>

          <div class="credits-guidelines">
            <div class="guideline-item">
              <i class="fas fa-info-circle"></i>
              <div>
                <strong>Definition:</strong> "AI credit" = the unit deducted from your account balance when an AI-enabled operation runs.
              </div>
            </div>
            <div class="guideline-item">
              <i class="fas fa-layer-group"></i>
              <div>
                <strong>Batch operations:</strong> If you analyze or migrate multiple resumes in a single bulk job, credits are charged per resume.
              </div>
            </div>
          </div>

          <n-alert type="info" style="margin-top: 24px;">
            <strong>Need Help?</strong> Questions or need custom limits/quotas for team plans? Contact 
            <a href="mailto:info@4aitechnology.com" style="color: var(--primary-start); text-decoration: underline;">
              info@4aitechnology.com
            </a>
          </n-alert>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NCard, NTable, NAlert } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'
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

.content-card {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 13px;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header h2 i {
  color: var(--secondary-start);
}

.section-header p {
  color: var(--text-medium);
  font-size: 16px;
}

.credits-info p {
  margin-bottom: 20px;
  line-height: 1.6;
}

.credits-disclaimer {
  margin-top: 12px;
  padding: 12px;
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  border-radius: 4px;
}

.credits-table {
  margin: 20px 0;
}

.feature-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-info i {
  color: var(--text-medium);
  font-size: 1.1em;
}

.credits-guidelines {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guideline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.guideline-item i {
  color: var(--secondary-start);
  font-size: 1.2em;
  margin-top: 2px;
}

.guideline-item div {
  flex: 1;
  line-height: 1.6;
}
</style>
