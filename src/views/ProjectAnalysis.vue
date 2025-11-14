<template>
  <div class="page-container">
    <PageBanner
      title="Project Analysis"
      subtitle="View and run resume analysis"
    />

    <div class="content-wrapper">
      <n-card class="analysis-card">
        <p>Project analysis functionality will be implemented here.</p>
        <p>Project ID: {{ projectId }}</p>
        <n-button type="primary" @click="goBack">Back to Projects</n-button>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => route.params.projectId as string)

function goBack() {
  router.push('/projects')
}
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

.analysis-card {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
</style>

