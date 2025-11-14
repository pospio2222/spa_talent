<template>
  <div class="chatflow-wrapper">
    <!-- Header -->
    <div class="chat-header">
      <div class="project-info">
        <h2>{{ projectName }}</h2>
        <p>{{ projectDetails }}</p>
      </div>
      <router-link to="/ai-assistant" class="back-btn">
        <i class="fas fa-arrow-left"></i> Back to AI Assistant
      </router-link>
    </div>

    <!-- Messages -->
    <div class="messages-area" ref="messagesArea">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.role]"
      >
        <div class="avatar">
          <img :src="msg.role === 'user' ? '/user.jpg' : '/bot.jpg'" :alt="msg.role">
        </div>
        <div class="message-bubble">
          <button class="copy-btn" @click="copyMessage(msg.content)">
            <i class="fas fa-copy"></i>
          </button>
          <div class="message-content" v-html="formatMessage(msg.content, msg.role)"></div>
        </div>
      </div>

      <div v-if="isTyping" class="typing-indicator">
        <span>AI is typing</span>
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="input-area">
      <div class="input-wrapper">
        <textarea
          v-model="userInput"
          class="message-input"
          placeholder="Ask me anything about your project analysis..."
          rows="1"
          @keypress.enter.exact="handleEnter"
          @input="autoResize"
          ref="inputRef"
        ></textarea>
        <button class="send-button" @click="sendMessage" :disabled="!userInput.trim() || isTyping">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'

const route = useRoute()
const message = useMessage()

const projectId = ref<number>(0)
const projectName = ref('Loading Project...')
const projectDetails = ref('Preparing AI Assistant')
const messages = ref<Array<{ role: string; content: string }>>([])
const userInput = ref('')
const isTyping = ref(false)
const messagesArea = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)

onMounted(async () => {
  await initializeChat()
})

async function initializeChat() {
  projectId.value = Number(route.query.project_id)
  
  if (!projectId.value) {
    message.error('Project ID is required')
    return
  }

  try {
    await loadProjectInfo()
    messages.value.push({
      role: 'assistant',
      content: "Hello! I'm your AI assistant. I have access to all the resume analyses to help answer questions about the candidates. What would you like to know?"
    })
    await nextTick()
    scrollToBottom()
    inputRef.value?.focus()
  } catch (error: any) {
    console.error('Failed to initialize chat:', error)
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error initializing the AI assistant. Please try again.'
    })
  }
}

async function loadProjectInfo() {
  try {
    const response = await fetch(
      `https://talent.api.4aitek.com/chatflow/project/${projectId.value}`,
      { credentials: 'include' }
    )

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        projectName.value = data.project_name || `Project ${projectId.value}`
        projectDetails.value = data.description || 'No description available'
      }
    }
  } catch (error: any) {
    console.error('Failed to load project info:', error)
    projectName.value = `Project ${projectId.value}`
    projectDetails.value = 'No description available'
  }
}

async function sendMessage() {
  if (!userInput.value.trim() || isTyping.value) return

  const userMessage = userInput.value.trim()
  messages.value.push({ role: 'user', content: userMessage })
  userInput.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  await nextTick()
  scrollToBottom()

  isTyping.value = true

  try {
    const response = await fetch('https://talent.api.4aitek.com/chatflow/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId.value,
        message: userMessage
      })
    })

    const data = await response.json()

    if (data.success && data.task_id) {
      pollTaskStatus(data.task_id)
    } else {
      isTyping.value = false
      const errMsg = String(data.error || '')
      if (errMsg.includes('Insufficient credits') || errMsg.toLowerCase().includes('credit')) {
        messages.value.push({ role: 'assistant', content: data.error })
      } else {
        messages.value.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.'
        })
      }
    }
  } catch (error: any) {
    isTyping.value = false
    console.error('Chat error:', error)
    messages.value.push({
      role: 'assistant',
      content: "Sorry, I'm having trouble connecting. Please check your connection and try again."
    })
  }
}

async function pollTaskStatus(taskId: string) {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(
        `https://talent.api.4aitek.com/task-status/${taskId}`,
        { credentials: 'include' }
      )
      const data = await response.json()

      if (data.state === 'SUCCESS') {
        clearInterval(interval)
        isTyping.value = false

        if (data.result && data.result.success) {
          messages.value.push({ role: 'assistant', content: data.result.response })
        } else {
          messages.value.push({
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your request. Please try again.'
          })
        }

        await nextTick()
        scrollToBottom()
      } else if (data.state === 'FAILURE') {
        clearInterval(interval)
        isTyping.value = false

        messages.value.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.'
        })
        console.error('Task failed:', data.error)
        await nextTick()
        scrollToBottom()
      }
    } catch (error: any) {
      clearInterval(interval)
      isTyping.value = false

      messages.value.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      })
      console.error('Polling error:', error)
      await nextTick()
      scrollToBottom()
    }
  }, 5000) // Poll every 5 seconds
}

function formatMessage(text: string, role: string): string {
  if (role === 'assistant') {
    // Simple formatting for AI responses
    return text
      .replace(/\n/g, '<br>')
      .replace(/^(\d+\.\s+)(.+)$/gm, '<div class="numbered-item"><span class="number">$1</span>$2</div>')
      .replace(/^[•*]\s+(.+)$/gm, '<div class="bullet-item"><span class="bullet">•</span> $1</div>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
  } else {
    // For user messages, just preserve line breaks
    return text.replace(/\n/g, '<br>')
  }
}

function copyMessage(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    message.success('Message copied to clipboard')
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      message.success('Message copied to clipboard')
    } catch {
      message.error('Failed to copy message')
    }
    document.body.removeChild(textArea)
  })
}

function scrollToBottom() {
  if (messagesArea.value) {
    setTimeout(() => {
      if (messagesArea.value) {
        messagesArea.value.scrollTop = messagesArea.value.scrollHeight
      }
    }, 100)
  }
}

function handleEnter(e: KeyboardEvent) {
  if (!e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function autoResize() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
  }
}
</script>

<style scoped>
.chatflow-wrapper {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-info h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.project-info p {
  margin: 5px 0 0 0;
  font-size: 14px;
  opacity: 0.8;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  text-decoration: none;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
}

.message {
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
}

.message.user {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-bubble {
  max-width: 70%;
  padding: 16px 20px;
  border-radius: 18px;
  position: relative;
}

.message.assistant .message-bubble {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
  color: white;
}

.message-content {
  line-height: 1.6;
}

.message-content :deep(code) {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.message-content :deep(.numbered-item) {
  display: flex;
  margin: 4px 0;
  padding-left: 8px;
}

.message-content :deep(.numbered-item .number) {
  font-weight: 600;
  color: #3b82f6;
  min-width: 30px;
  flex-shrink: 0;
}

.message-content :deep(.bullet-item) {
  display: flex;
  margin: 4px 0;
  padding-left: 16px;
}

.message-content :deep(.bullet-item .bullet) {
  color: #3b82f6;
  font-weight: bold;
  min-width: 16px;
  flex-shrink: 0;
}

.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
}

.copy-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.message-bubble:hover .copy-btn {
  opacity: 1;
}

.message.user .copy-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.message.user .copy-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  color: #718096;
  font-style: italic;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #cbd5e1;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}
.typing-dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.input-area {
  padding: 20px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  max-width: 800px;
  margin: 0 auto;
}

.message-input {
  flex: 1;
  min-height: 50px;
  max-height: 120px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 25px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
}

.message-input:focus {
  border-color: #3b82f6;
}

.send-button {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.send-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(63, 81, 181, 0.3);
}

.send-button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  transform: none;
}

.messages-area::-webkit-scrollbar {
  width: 6px;
}

.messages-area::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.messages-area::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.messages-area::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@media (max-width: 768px) {
  .chatflow-wrapper {
    height: calc(100vh - 150px);
    margin: 10px;
  }

  .chat-header {
    padding: 15px 20px;
  }

  .input-area {
    padding: 15px;
  }

  .message-bubble {
    max-width: 85%;
  }
}
</style>

