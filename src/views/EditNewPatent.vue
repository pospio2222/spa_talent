<template>
  <div class="edit-patent-container">
    <!-- Header with Back Button -->
    <div class="edit-patent-header">
      <h1>Improve Patent</h1>
      <div class="header-actions">
        <n-button @click="goBack" class="btn btn-secondary">
          <i class="fas fa-arrow-left"></i> Back
        </n-button>
      </div>
    </div>
    
    <div class="edit-patent-content">
      <!-- Mode Toggle -->
      <div class="mode-toggle-container">
        <div class="mode-toggle">
          <button 
            class="mode-toggle-btn" 
            :class="{ active: currentMode === 'improve' }"
            @click="switchMode('improve')"
          >
            <i class="fas fa-pen-fancy"></i>
            Edit with AI
          </button>
          <button 
            class="mode-toggle-btn" 
            :class="{ active: currentMode === 'ask' }"
            @click="switchMode('ask')"
          >
            <i class="fas fa-comments"></i>
            Ask AI
          </button>
        </div>
        <div class="mode-tip">
          <i class="fas fa-lightbulb" style="color:#f59e0b;"></i>
          <span style="font-weight:600; color:#475569;">Tip:</span>
          <span>"Edit with AI" lets the AI update your content. "Ask AI" just gives advice or answers — your content stays untouched.</span>
        </div>
      </div>

      <!-- Upper Area: Controls and Actions -->
      <div class="controls-area">
        <div class="controls-section">
          <div style="flex: 1;">
            <div class="control-group">
              <label for="improvement-instructions">{{ instructionsLabel }}</label>
              <textarea 
                v-model="instructions"
                id="improvement-instructions" 
                :placeholder="instructionsPlaceholder"
              ></textarea>
            </div>
          </div>
          <div style="width: 200px; flex-shrink: 0;">
            <div class="control-group">
              <label for="improvement-doc">{{ docLabel }}</label>
              <input 
                ref="improvementDocInput"
                type="file" 
                id="improvement-doc" 
                accept=".pdf,.docx,.txt,.md" 
                style="width: 100%;"
              />
            </div>
          </div>
          <div style="display: flex; align-items: center; height: 100%; padding-top: 30px;">
            <n-button
              type="primary"
              :loading="isProcessing"
              :disabled="!instructions.trim()"
              @click="handleAIAction"
            >
              <template #icon>
                <i :class="currentMode === 'ask' ? 'fas fa-comments' : 'fas fa-pen-fancy'"></i>
              </template>
              {{ currentMode === 'ask' ? 'Ask AI' : 'AI Edit' }}
            </n-button>
          </div>
        </div>
      </div>

      <!-- AI Response Panel (visible only in Ask AI mode) -->
      <div 
        v-if="currentMode === 'ask'" 
        class="ai-response-panel" 
        :class="{ visible: aiResponseVisible }"
      >
        <div class="ai-response-header">
          <div class="ai-response-left">
            <div class="ai-response-title">
              <i class="fas fa-comments"></i>
              AI Response
            </div>
            <div class="ai-question-bar">
              <i class="fas fa-question-circle" style="color:#0ea5e9;"></i>
              <span class="ai-question-label">Question:</span>
              <div class="ai-question-content" :title="lastQuestion">{{ lastQuestion }}</div>
            </div>
          </div>
          <button class="copy-response-btn" @click="copyResponse">
            <i class="fas fa-copy"></i>
            Copy
          </button>
        </div>
        <div class="ai-response-content">
          <div v-if="aiResponseLoading" class="ai-response-loading">
            <div class="spinner"></div>
            Processing your question...
          </div>
          <div v-else style="white-space: pre-wrap;">{{ aiResponse }}</div>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="action-bar">
        <!-- Instructions Panel -->
        <div class="instructions-panel">
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 8px 12px; display: flex; align-items: center; height: 40px;">
            <i class="fas fa-info-circle" style="color: #0ea5e9; margin-right: 8px; flex-shrink: 0;"></i>
            <span style="font-weight: 600; color: #0c4a6e; font-size: 13px; margin-right: 8px; flex-shrink: 0;">Previous AI Instruction:</span>
            <div 
              class="instructions-content" 
              :title="previousInstructions"
            >
              {{ previousInstructions || 'Loading instructions...' }}
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 10px;">
          <n-button
            type="success"
            :loading="isSaving"
            @click="saveManualEdit"
          >
            <template #icon>
              <i class="fas fa-save"></i>
            </template>
            Save Manual Edit
          </n-button>
          <n-button
            secondary
            @click="exportContent"
          >
            Export
          </n-button>
        </div>
      </div>

      <!-- Lower Area: Editor -->
      <div class="editor-area">
        <div class="editor-labels">
          <div style="flex: 1; padding: 10px 20px; background: #fef2f2; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <small style="color: #6b7280; font-size: 12px; font-weight: 600;">Previous - Non-editable</small>
          </div>
          <div style="flex: 1; padding: 10px 20px; background: #f0fdf4; border-bottom: 1px solid #e5e7eb;">
            <small style="color: #6b7280; font-size: 12px; font-weight: 600;">Current - Editable</small>
          </div>
        </div>
        <div ref="editorContainer" class="diff-editor-container"></div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="showLoadingOverlay" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Processing patent improvements...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, useMessage } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const message = useMessage()

// Refs
const editorContainer = ref<HTMLElement | null>(null)
const improvementDocInput = ref<HTMLInputElement | null>(null)
let diffEditor: any = null

// State
const currentMode = ref<'improve' | 'ask'>('improve')
const instructions = ref('')
const isProcessing = ref(false)
const isSaving = ref(false)
const showLoadingOverlay = ref(false)
const previousInstructions = ref('')
const currentVersion = ref(0)

// AI Response state
const aiResponseVisible = ref(false)
const aiResponse = ref('')
const aiResponseLoading = ref(false)
const lastQuestion = ref('')

// Polling
let pollInterval: number | null = null
let processingTaskId: string | null = null

// Computed
const projectId = computed(() => route.params.projectId as string)

const instructionsLabel = computed(() => 
  currentMode.value === 'ask' 
    ? 'Ask AI about your patent (Required)' 
    : 'AI Instructions for Improvement (Required)'
)

const instructionsPlaceholder = computed(() => 
  currentMode.value === 'ask'
    ? 'Ask a question about your patent claims, patentability, or request analysis...'
    : 'Provide specific instructions for improving the patent claims...'
)

const docLabel = computed(() => 
  currentMode.value === 'ask'
    ? 'Add document for context (optional)'
    : 'Add document for context (optional)'
)

// Navigation
function goBack() {
  router.push('/create-patent')
}

// Mode switching
function switchMode(mode: 'improve' | 'ask') {
  currentMode.value = mode
  if (mode === 'improve') {
    aiResponseVisible.value = false
  }
}

// Initialize Monaco Editor from CDN
onMounted(async () => {
  // Force refresh once after 1 second if this is first load
  const refreshKey = `refreshed_${projectId.value}`
  if (!sessionStorage.getItem(refreshKey)) {
    sessionStorage.setItem(refreshKey, 'true')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    return
  }
  
  const win = window as any
  
  // Check if Monaco is already loaded
  if (!win.monaco) {
    // Step 1: Load Monaco script only if not already loaded
    if (!win.require) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs/loader.js'
        script.onload = () => resolve()
        document.head.appendChild(script)
      })
    }
    
    // Step 2: Configure and load Monaco
    await new Promise<void>((resolve) => {
      win.require.config({ 
        paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs' }
      })
      win.require(['vs/editor/editor.main'], () => resolve())
    })
  }
  
  // Step 3: Create editor
  if (editorContainer.value && win.monaco) {
    diffEditor = win.monaco.editor.createDiffEditor(editorContainer.value, {
      theme: 'vs-light',
      readOnly: false,
      renderSideBySide: true,
      automaticLayout: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      minimap: { enabled: false }
    })
  }
  
  // Step 4: Load data
  await loadPatentData()
})

onUnmounted(() => {
  if (diffEditor) {
    diffEditor.dispose()
  }
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})

// Load patent data - SEQUENTIAL
async function loadPatentData() {
  if (processingTaskId) {
    showProcessingView()
    startTaskPolling(processingTaskId)
    return
  }
  
  const response = await fetch(
    `https://patent.api.4aitek.com/api/get-patent-data/${projectId.value}`,
    { credentials: 'include' }
  )
  
  const data = await response.json()
  
  if (data.success && data.data) {
    currentVersion.value = data.data.current_version
    previousInstructions.value = data.data.instructions || 'No specific instructions provided for this edit.'
    
    if (diffEditor) {
      const win = window as any
      const originalModel = win.monaco.editor.createModel(data.data.left_content, 'text/plain')
      const modifiedModel = win.monaco.editor.createModel(data.data.right_content, 'text/plain')
      
      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
      })
    }
    
    showReadyState()
  } else {
    message.error('Failed to load patent data')
  }
}

// Save manual edit
async function saveManualEdit() {
  if (!diffEditor) return
  
  const modifiedModel = diffEditor.getModel()?.modified
  if (!modifiedModel) return
  
  const updatedClaims = modifiedModel.getValue()
  isSaving.value = true
  
  try {
    const response = await fetch(
      `https://patent.api.4aitek.com/api/save-edit/${projectId.value}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updated_claims: updatedClaims })
      }
    )
    
    const data = await response.json()
    
    if (data.success) {
      message.success(data.message || 'Successfully updated edit')
    } else {
      message.error('Error: ' + (data.message || 'Unknown error occurred'))
    }
  } catch (error: any) {
    message.error('Error saving changes: ' + (error.message || 'Network error'))
  } finally {
    isSaving.value = false
  }
}

// Handle AI action (improve or ask)
async function handleAIAction() {
  if (!instructions.value.trim()) {
    message.warning(
      currentMode.value === 'ask'
        ? 'Please enter a question for the AI.'
        : 'AI instructions are required.'
    )
    return
  }
  
  if (!diffEditor) return
  
  const modifiedModel = diffEditor.getModel()?.modified
  if (!modifiedModel) return
  
  const modifiedClaims = modifiedModel.getValue()
  const improvementDoc = improvementDocInput.value?.files?.[0]
  
  if (currentMode.value === 'ask') {
    await handleAskAI(modifiedClaims, instructions.value, improvementDoc)
  } else {
    await handleAIImprovement(modifiedClaims, instructions.value, improvementDoc)
  }
}

// Handle AI improvement
async function handleAIImprovement(
  modifiedClaims: string,
  instructionsText: string,
  improvementDoc?: File
) {
  isProcessing.value = true
  
  try {
    const formData = new FormData()
    formData.append('project_id', projectId.value)
    formData.append('modified_claims', modifiedClaims)
    formData.append('instructions', instructionsText)
    if (improvementDoc) {
      formData.append('improvement_doc', improvementDoc)
    }
    
    const response = await fetch(
      'https://patent.api.4aitek.com/api/process-patent-improvement',
      {
        method: 'POST',
        credentials: 'include',
        body: formData
      }
    )
    
    const data = await response.json()
    
    if (data.success && data.task_id) {
      // Clear form
      instructions.value = ''
      if (improvementDocInput.value) {
        improvementDocInput.value.value = ''
      }
      
      // Store task_id and show processing view
      processingTaskId = data.task_id
      showProcessingView()
      
      // Start polling for completion
      startTaskPolling(data.task_id)
    } else {
      message.error('Error: ' + (data.error || 'Unknown error occurred'))
    }
  } catch (error: any) {
    message.error('Error submitting improvements: ' + (error.message || 'Network error'))
  } finally {
    isProcessing.value = false
  }
}

// Handle Ask AI
async function handleAskAI(
  currentClaims: string,
  question: string,
  contextDoc?: File
) {
  aiResponseVisible.value = true
  aiResponseLoading.value = true
  aiResponse.value = ''
  lastQuestion.value = question
  isProcessing.value = true
  
  try {
    const formData = new FormData()
    formData.append('project_id', projectId.value)
    formData.append('current_claims', currentClaims)
    formData.append('question', question)
    if (contextDoc) {
      formData.append('context_doc', contextDoc)
    }
    
    const response = await fetch(
      'https://patent.api.4aitek.com/api/ask-ai-about-patent',
      {
        method: 'POST',
        credentials: 'include',
        body: formData
      }
    )
    
    const data = await response.json()
    
    if (data.success && data.task_id) {
      // Clear form
      instructions.value = ''
      if (improvementDocInput.value) {
        improvementDocInput.value.value = ''
      }
      
      // Start polling for task status
      pollAskAIStatus(data.task_id)
    } else {
      aiResponse.value = 'Error: ' + (data.error || 'Unknown error occurred')
      aiResponseLoading.value = false
      isProcessing.value = false
    }
  } catch (error: any) {
    aiResponse.value = 'Error: ' + (error.message || 'Network error')
    aiResponseLoading.value = false
    isProcessing.value = false
  }
}

// Poll Ask AI status
function pollAskAIStatus(taskId: string) {
  let pollCount = 0
  const maxPolls = 300
  
  const interval = window.setInterval(async () => {
    if (++pollCount > maxPolls) {
      clearInterval(interval)
      aiResponse.value = 'Error: Request timed out. Please try again.'
      aiResponseLoading.value = false
      isProcessing.value = false
      return
    }
    
    try {
      const response = await fetch(
        `https://patent.api.4aitek.com/api/task-status/${taskId}`,
        { credentials: 'include' }
      )
      
      const data = await response.json()
      
      if (data.state === 'SUCCESS' && data.result) {
        clearInterval(interval)
        aiResponse.value = data.result.response
        aiResponseLoading.value = false
        isProcessing.value = false
        message.success('AI response received!')
      } else if (data.state === 'FAILURE') {
        clearInterval(interval)
        aiResponse.value = 'Error: ' + (data.error || 'Task failed')
        aiResponseLoading.value = false
        isProcessing.value = false
      }
    } catch (error: any) {
      console.error('Polling error:', error)
    }
  }, 5000)
}

// Start task polling
function startTaskPolling(taskId: string) {
  if (pollInterval) clearInterval(pollInterval)
  
  let pollCount = 0
  const maxPolls = 300
  
  pollInterval = window.setInterval(async () => {
    if (++pollCount > maxPolls) {
      if (pollInterval) clearInterval(pollInterval)
      pollInterval = null
      processingTaskId = null
      showReadyState()
      message.error('Processing took too long. Please refresh and try again.')
      return
    }
    
    try {
      const response = await fetch(
        `https://patent.api.4aitek.com/api/task-status/${taskId}`,
        { credentials: 'include' }
      )
      
      const data = await response.json()
      
      if (data.state === 'SUCCESS') {
        if (pollInterval) clearInterval(pollInterval)
        pollInterval = null
        processingTaskId = null
        await loadPatentData()
        message.success('Patent claims updated successfully!')
      } else if (data.state === 'FAILURE') {
        if (pollInterval) clearInterval(pollInterval)
        pollInterval = null
        processingTaskId = null
        showReadyState()
        message.error(data.error || 'Processing failed. Please try again.')
        await loadPatentData()
      }
    } catch (error: any) {
      console.error('Polling error:', error)
    }
  }, 5000)
}

// Show processing view
function showProcessingView() {
  isProcessing.value = true
  showLoadingOverlay.value = false
  
  if (diffEditor) {
    const win = window as any
    const processingInstructionsText = instructions.value.trim() || 'AI improvements'
    const originalModel = win.monaco.editor.createModel(
      `AI instructions under processing:\n\n${processingInstructionsText}`,
      'text/plain'
    )
    const modifiedModel = win.monaco.editor.createModel(
      'AI is processing your edits...\n\nPlease wait while the AI generates improved claims based on your instructions.\n\nThis may take several minutes.',
      'text/plain'
    )
    
    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel
    })
  }
}

// Show ready state
function showReadyState() {
  isProcessing.value = false
  showLoadingOverlay.value = false
}

// Copy response
function copyResponse() {
  if (aiResponse.value) {
    navigator.clipboard.writeText(aiResponse.value)
      .then(() => message.success('Response copied to clipboard!'))
      .catch(() => message.error('Failed to copy'))
  }
}

// Export content
function exportContent() {
  if (!diffEditor) return
  
  const modifiedModel = diffEditor.getModel()?.modified
  if (!modifiedModel) return
  
  const content = modifiedModel.getValue()
  const blob = new Blob([content], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `patent-claims-project-${projectId.value}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
</script>

<style scoped>
.edit-patent-container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  overflow: hidden;
  margin: 7px auto;
  max-width: 1400px;
}

.edit-patent-header {
  background: #f8fafc;
  color: #374151;
  padding: 20px 30px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-patent-header h1 {
  font-size: 1.8em;
  margin: 0;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.btn-secondary {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.edit-patent-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px);
  min-height: 800px;
}

/* Mode Toggle */
.mode-toggle-container {
  padding: 15px 25px 0 25px;
  background: #f9fafb;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.mode-toggle {
  display: inline-flex;
  background: #e5e7eb;
  border-radius: 10px;
  padding: 4px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
}

.mode-toggle-btn {
  padding: 10px 24px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.9em;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.mode-toggle-btn i {
  font-size: 1.1em;
}

.mode-toggle-btn.active {
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(63, 81, 181, 0.3);
  transform: translateY(-1px);
}

.mode-toggle-btn:not(.active):hover {
  background: rgba(255,255,255,0.5);
  color: #374151;
}

.mode-tip {
  color: #64748b;
  font-size: 0.9em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
}

/* Controls Area */
.controls-area {
  flex-shrink: 0;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.controls-section {
  padding: 20px 25px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.control-group {
  display: flex;
  flex-direction: column;
}

.control-group label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.control-group textarea {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9em;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

/* AI Response Panel */
.ai-response-panel {
  background: #f0f9ff;
  border-bottom: 2px solid #bae6fd;
  padding: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease, padding 0.4s ease;
  flex-shrink: 0;
}

.ai-response-panel.visible {
  max-height: 400px;
  padding: 20px 25px;
}

.ai-response-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.ai-response-left {
  flex: 1;
  min-width: 0;
}

.ai-response-title {
  font-weight: 600;
  color: #0c4a6e;
  font-size: 1em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-response-title i {
  color: #0ea5e9;
}

.ai-question-bar {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 6px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  height: 36px;
  margin-top: 6px;
  gap: 8px;
}

.ai-question-label {
  font-weight: 600;
  color: #0c4a6e;
  font-size: 13px;
  flex-shrink: 0;
}

.ai-question-content {
  color: #0c4a6e;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.copy-response-btn {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.copy-response-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.3);
}

.ai-response-content {
  background: white;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 15px;
  max-height: 280px;
  overflow-y: auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.9em;
  line-height: 1.6;
  color: #1e293b;
}

.ai-response-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #0c4a6e;
  font-style: italic;
  padding: 30px;
}

.ai-response-loading .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
  border-top-color: #0ea5e9;
}

/* Action Bar */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  gap: 10px;
  flex-shrink: 0;
}

.instructions-panel {
  flex: 1;
  margin-right: 20px;
}

.instructions-content {
  color: #0c4a6e;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-style: italic;
}

/* Editor Area */
.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-labels {
  display: flex;
  flex-shrink: 0;
}

.diff-editor-container {
  flex: 1;
  min-height: 400px;
  border: 1px solid #e5e7eb;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.spinner {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3F51B5;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

