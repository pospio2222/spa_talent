<template>
  <div class="ai-assistant-container">
    <PageBanner title="AI Assistant" />
    
    <div class="content-wrapper">
      <n-card title="Talent AI Assistant" class="chat-card">
        <div class="chat-messages" ref="chatContainer">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message', msg.role]"
          >
            <div class="message-content">
              <div class="message-header">
                <i :class="msg.role === 'user' ? 'fas fa-user' : 'fas fa-robot'"></i>
                <span>{{ msg.role === 'user' ? 'You' : 'AI Assistant' }}</span>
              </div>
              <div class="message-text" v-html="formatMessage(msg.content)"></div>
            </div>
          </div>
          
          <div v-if="isLoading" class="message assistant">
            <div class="message-content">
              <div class="message-header">
                <i class="fas fa-robot"></i>
                <span>AI Assistant</span>
              </div>
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <n-input
            v-model:value="userInput"
            type="textarea"
            placeholder="Ask about candidates, recruiting strategies, or get insights..."
            :rows="3"
            @keydown.enter.ctrl="sendMessage"
          />
          <n-button type="primary" @click="sendMessage" :loading="isLoading">
            <i class="fas fa-paper-plane"></i> Send
          </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { NCard, NInput, NButton, useMessage } from 'naive-ui'
import PageBanner from '@/components/PageBanner.vue'

const message = useMessage()

const messages = ref<any[]>([])
const userInput = ref('')
const isLoading = ref(false)
const chatContainer = ref<HTMLElement | null>(null)

async function sendMessage() {
  if (!userInput.value.trim() || isLoading.value) return
  
  const userMessage = userInput.value.trim()
  messages.value.push({ role: 'user', content: userMessage })
  userInput.value = ''
  
  await nextTick()
  scrollToBottom()
  
  isLoading.value = true
  
  try {
    const response = await fetch('https://talent.api.4aitek.com/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      messages.value.push({ role: 'assistant', content: data.response })
    } else {
      message.error('Failed to get response')
    }
  } catch (error: any) {
    console.error('Chat error:', error)
    message.error('Error communicating with AI')
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

function formatMessage(text: string): string {
  return text.replace(/\n/g, '<br>')
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}
</script>

<style scoped>
.ai-assistant-container {
  min-height: calc(100vh - 60px);
  background: #f8f9fa;
}

.content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
}

.chat-card {
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.message {
  margin-bottom: 20px;
}

.message-content {
  max-width: 80%;
  padding: 15px;
  border-radius: 12px;
}

.message.user .message-content {
  margin-left: auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message.assistant .message-content {
  background: white;
  border: 1px solid #e2e8f0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 0.9em;
}

.message.user .message-header {
  color: rgba(255, 255, 255, 0.9);
}

.message.assistant .message-header {
  color: #4a5568;
}

.message-text {
  line-height: 1.6;
}

.typing-indicator {
  display: flex;
  gap: 5px;
  padding: 10px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.chat-input {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
</style>

