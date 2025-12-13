<template>
  <n-button class="app-back-btn" secondary :disabled="disabled" @click="handleClick">
    <template #icon>
      <n-icon><ArrowBackOutline /></n-icon>
    </template>
    <slot>Back</slot>
  </n-button>
</template>

<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'

const props = defineProps<{
  to?: string
  replace?: boolean
  disabled?: boolean
}>()

const router = useRouter()

function handleClick() {
  if (props.to) {
    if (props.replace) router.replace(props.to)
    else router.push(props.to)
    return
  }
  router.back()
}
</script>

<style scoped>
.app-back-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;

  background: rgba(255, 255, 255, 0.92);
  color: #1d4ed8;
  border: 1px solid rgba(29, 78, 216, 0.22);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);

  transition: background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.app-back-btn:hover:not(:disabled) {
  background: #eff6ff;
  border-color: rgba(29, 78, 216, 0.38);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.app-back-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1);
}

.app-back-btn :deep(.n-button__icon) {
  font-size: 18px;
}
</style>
