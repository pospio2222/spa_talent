<template>
  <div class="dashboard-container">
    <n-layout has-sider position="absolute">
      <!-- Sidebar -->
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
        :native-scrollbar="false"
        class="sidebar"
      >
        <div class="sidebar-content">
          <!-- Logo -->
          <div class="logo-section">
            <div class="logo-wrapper">
              <img src="/icon_pink.png" alt="T4LENT" class="logo-icon" />
              <span v-show="!collapsed" class="logo-text">T4LENT</span>
            </div>
          </div>

          <!-- Navigation Menu -->
          <n-menu
            v-model:value="activeKey"
            :collapsed="collapsed"
            :collapsed-width="64"
            :collapsed-icon-size="22"
            :options="menuOptions"
            @update:value="handleMenuSelect"
          />
          
          <!-- Footer Section -->
          <div class="sidebar-footer">
            <div v-if="isLoggedIn" class="footer-links">
              <!-- Credits Display (non-clickable) -->
              <div class="credits-display">
                <i class="fas fa-coins"></i>
                <span v-show="!collapsed">
                  <span v-if="credits !== null">{{ credits }}</span>
                  <span v-else>-</span>
                  <span style="margin-left: 4px;">Credits</span>
                </span>
              </div>
              
              <!-- Profile, Settings, and Credits Icons -->
              <div class="user-actions" :class="{ 'collapsed': collapsed }">
                <a 
                  href="https://4aitek.com/profile"
                  @click.prevent="openPopup('https://4aitek.com/profile')"
                  class="icon-link profile-link"
                  title="Profile"
                >
                  <i class="fas fa-user"></i>
                </a>
                <a 
                  href="https://4aitek.com/settings"
                  @click.prevent="openPopup('https://4aitek.com/settings')"
                  class="icon-link settings-link"
                  title="Settings"
                >
                  <i class="fas fa-cog"></i>
                </a>
                <a 
                  href="https://4aitek.com/credits"
                  @click.prevent="openPopup('https://4aitek.com/credits')"
                  class="icon-link credits-link-icon"
                  title="Purchase Credits"
                >
                  <i class="fas fa-credit-card"></i>
                </a>
              </div>
              
              <!-- Logout Button -->
              <n-button
                v-show="!collapsed"
                size="small"
                @click="handleLogout"
                class="logout-btn"
                block
              >
                Logout
              </n-button>
            </div>
            <n-button
              v-else
              type="primary"
              block
              @click="handleLogin"
              class="login-btn"
            >
              <i class="fas fa-sign-in-alt"></i>
              <span v-show="!collapsed">Login</span>
            </n-button>
          </div>
        </div>
      </n-layout-sider>

      <!-- Main Content -->
      <n-layout :native-scrollbar="false">
        <n-layout-content class="main-content">
          <div v-if="loading" class="loading-container">
            <n-spin size="large" />
          </div>
          <div v-else-if="!isLoggedIn" class="auth-required">
            <div class="wave-background">
              <div class="air air1"></div>
              <div class="air air2"></div>
              <div class="air air3"></div>
              <div class="air air4"></div>
            </div>
            <div class="auth-card">
              <h1 class="auth-title">Authentication Required</h1>
              <p class="auth-message">Please log in to access T4LENT features.</p>
              <button class="auth-login-btn" @click="handleLogin">
                <i class="fas fa-arrow-right"></i>
                Login
              </button>
            </div>
          </div>
          <router-view v-else />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, h, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutContent, NMenu, NButton, NSpin, MenuOption } from 'naive-ui'
import { useAuth } from '@/composables/useAuth'
import { config } from '@/config'
import api from '@/utils/api'

const router = useRouter()
const route = useRoute()
const { isLoggedIn, loading, login, logout } = useAuth()

const collapsed = ref(false)
const activeKey = ref('console')
const credits = ref<number | null>(null)

const fetchCredits = async () => {
  if (!isLoggedIn.value) {
    credits.value = null
    return
  }

  try {
    const res = await api.get(`${config.creditsApiUrl}/api/credits`)
    
    if (res.data.success) {
      credits.value = res.data.credits
    }
  } catch (err) {
    console.error('Failed to fetch credits:', err)
  }
}

// Fetch credits when logged in
watch(isLoggedIn, (newVal) => {
  if (newVal) {
    fetchCredits()
  } else {
    credits.value = null
  }
})

onMounted(() => {
  if (isLoggedIn.value) {
    fetchCredits()
  }
})

// Menu options matching archived landing app
const menuOptions = computed<MenuOption[]>(() => [
  {
    label: 'Information',
    key: 'console',
    icon: () => h('i', { class: 'fas fa-info-circle' })
  },
  {
    label: 'Resume Analysis',
    key: 'projects',
    icon: () => h('i', { class: 'fas fa-chart-line' })
  },
  {
    label: 'AI Talent Assistant',
    key: 'ai-assistant',
    icon: () => h('i', { class: 'fas fa-robot' })
  },
  {
    label: 'Manage Candidates',
    key: 'candidates',
    icon: () => h('i', { class: 'fas fa-users' })
  },
  {
    label: 'Customize AI',
    key: 'customize-ai',
    icon: () => h('i', { class: 'fas fa-brain' })
  }
])

// Update active key based on route
const updateActiveKey = () => {
  const path = route.path
  if (path === '/console' || path === '/') {
    activeKey.value = 'console'
  } else if (path.startsWith('/projects')) {
    activeKey.value = 'projects'
  } else if (path.startsWith('/ai-assistant')) {
    activeKey.value = 'ai-assistant'
  } else if (path.startsWith('/candidates')) {
    activeKey.value = 'candidates'
  } else if (path.startsWith('/customize-ai')) {
    activeKey.value = 'customize-ai'
  } else {
    activeKey.value = ''
  }
}

const handleMenuSelect = (key: string) => {
  activeKey.value = key
  router.push(`/${key === 'console' ? 'console' : key}`)
}

const handleLogin = () => {
  login()
}

const handleLogout = async () => {
  await logout()
}

const openPopup = (url: string) => {
  const loginUrl = `${config.authOrigin}/login?return=${encodeURIComponent(url)}`
  const width = 1200
  const height = 800
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2
  window.open(
    loginUrl,
    '_blank',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  )
}

// Watch route changes
router.afterEach(() => {
  updateActiveKey()
})

updateActiveKey()
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.sidebar {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  height: 100vh;
  border-right: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(148, 163, 184, 0.1);
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo-section {
  padding: 24px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 18px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: var(--radius-sm);
}

.logo-text {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.sidebar-footer {
  margin-top: auto;
  padding: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.credits-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  color: var(--text-dark);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  background: rgba(148, 163, 184, 0.1);
}

.credits-display i {
  font-size: 14px;
  color: var(--text-medium);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
}

/* When sidebar is collapsed, stack icons vertically */
.user-actions.collapsed {
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  color: var(--text-medium);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.icon-link:hover {
  background: rgba(148, 163, 184, 0.1);
  color: var(--text-dark);
}

.icon-link i {
  font-size: 16px;
}

.profile-link i {
  color: var(--text-medium);
}

.settings-link i {
  color: var(--text-medium);
}

.credits-link-icon i {
  color: var(--text-medium);
}

.login-btn {
  border-radius: 12px !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(63, 81, 181, 0.2) !important;
  transition: all 0.3s ease !important;
}

.login-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(63, 81, 181, 0.3) !important;
}

.login-btn i {
  margin-right: 8px;
}

.logout-btn {
  background: rgba(148, 163, 184, 0.1) !important;
  color: var(--text-dark) !important;
  border: none !important;
  border-radius: 12px !important;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(148, 163, 184, 0.15) !important;
  color: var(--text-dark) !important;
}

.main-content {
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  height: 100vh;
  overflow-y: auto;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.auth-required {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  padding: 0;
  margin: -16px;
}

.wave-background {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.auth-required .air {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: url(https://1.bp.blogspot.com/-xQUc-TovqDk/XdxogmMqIRI/AAAAAAAACvI/AizpnE509UMGBcTiLJ58BC6iViPYGYQfQCLcBGAsYHQ/s1600/wave.png);
  background-size: 1000px 100px;
  pointer-events: none;
}

.auth-required .air.air1 {
  animation: wave 30s linear infinite;
  z-index: 0;
  opacity: 1;
  animation-delay: 0s;
  bottom: 0;
}

.auth-required .air.air2 {
  animation: wave2 15s linear infinite;
  z-index: 0;
  opacity: 0.5;
  animation-delay: -5s;
  bottom: 10px;
}

.auth-required .air.air3 {
  animation: wave 30s linear infinite;
  z-index: 0;
  opacity: 0.2;
  animation-delay: -2s;
  bottom: 15px;
}

.auth-required .air.air4 {
  animation: wave2 5s linear infinite;
  z-index: 0;
  opacity: 0.7;
  animation-delay: -5s;
  bottom: 20px;
}

@keyframes wave {
  0% {
    background-position-x: 0px;
  }
  100% {
    background-position-x: 1000px;
  }
}

@keyframes wave2 {
  0% {
    background-position-x: 0px;
  }
  100% {
    background-position-x: -1000px;
  }
}

.auth-card {
  position: relative;
  z-index: 10;
  background: white;
  border-radius: 24px;
  padding: 48px 56px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
  width: 90%;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-message {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 32px;
  line-height: 1.6;
}

.auth-login-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.auth-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.auth-login-btn:active {
  transform: translateY(0);
}

.auth-login-btn i {
  font-size: 14px;
}

/* Menu styling - dark grey icons and text, smaller size */
:deep(.n-menu-item) {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568 !important;
}

:deep(.n-menu-item .n-menu-item-content) {
  color: #4a5568 !important;
}

:deep(.n-menu-item .n-menu-item-content i) {
  font-size: 16px;
  color: #4a5568 !important;
}

/* Active menu item styling */
:deep(.n-menu-item.n-menu-item--selected) {
  background: linear-gradient(135deg, #3F51B5 0%, #2196F3 50%, #10b981 100%) !important;
}

:deep(.n-menu-item.n-menu-item--selected .n-menu-item-content) {
  color: white !important;
}

:deep(.n-menu-item.n-menu-item--selected .n-menu-item-content i) {
  color: white !important;
}

/* Hover state */
:deep(.n-menu-item:hover:not(.n-menu-item--selected)) {
  background: rgba(74, 85, 104, 0.05);
}

:deep(.n-menu-item:hover:not(.n-menu-item--selected) .n-menu-item-content) {
  color: #4a5568 !important;
}

:deep(.n-menu-item:hover:not(.n-menu-item--selected) .n-menu-item-content i) {
  color: #4a5568 !important;
}
</style>

