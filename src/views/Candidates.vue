<template>
  <div class="candidates-overview-container">
    <PageBanner title="All Candidates" />
    
    <div class="content-wrapper">
      <n-card title="Candidate Overview">
        <p>Select a project to view its candidates:</p>
        <n-button @click="$router.push('/projects')" type="primary">
          <i class="fas fa-briefcase"></i> Go to Projects
        </n-button>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NCard, NButton } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'
</script>

<style scoped>
.candidates-overview-container {
  min-height: calc(100vh - 60px);
  background: #f8f9fa;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}
</style>

