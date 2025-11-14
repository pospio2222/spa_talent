<template>
  <div class="candidate-detail-container">
    <PageBanner title="Candidate Detail" />
    
    <div class="content-wrapper">
      <n-card>
        <n-button @click="$router.back()">
          <i class="fas fa-arrow-left"></i> Back
        </n-button>
        
        <div class="detail-content">
          <h2>{{ candidateName }}</h2>
          <p>Full candidate detail view coming soon...</p>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NCard, NButton } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'

const route = useRoute()
const candidateName = ref('')

const resumeId = computed(() => route.params.resumeId as string)

onMounted(() => {
  // Load candidate details
  candidateName.value = `Candidate ${resumeId.value}`
})
</script>

<style scoped>
.candidate-detail-container {
  min-height: calc(100vh - 60px);
  background: #f8f9fa;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.detail-content {
  margin-top: 30px;
}
</style>

