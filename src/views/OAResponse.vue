<template>
  <div class="page-container">
    <div class="page-header">
      <h1>
        <n-icon :component="ReturnUpBack" />
        Office Action Response
      </h1>
      <p>AI-powered assistance for responding to office actions</p>
    </div>

    <n-card class="content-card">
      <n-empty description="OA Response feature coming soon">
        <template #icon>
          <n-icon :component="ReturnUpBack" :size="48" style="color: var(--text-medium);" />
        </template>
        <template #extra>
          <p style="color: var(--text-medium); margin-top: 12px;">
            This page will help you craft comprehensive responses to patent office actions.
          </p>
        </template>
      </n-empty>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NCard, NEmpty, NIcon } from 'naive-ui'
import { ReturnUpBack } from '@vicons/ionicons5'
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h1 .n-icon {
  color: var(--primary-start);
}

.page-header p {
  font-size: 18px;
  color: var(--text-medium);
}

.content-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

