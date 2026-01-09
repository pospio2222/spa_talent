/**
 * Talent4AI - Authentication Composable
 * 
 * JWT-based authentication using Authorization headers.
 * Delegates login to the centralized Auth SPA (auth.4aitek.com).
 * Agreement check is handled by Auth SPA before redirect.
 * 
 * Uses singleton pattern to share auth state across all components.
 */

import { ref, onMounted, onUnmounted } from 'vue'
import {
  isLoggedIn as checkIsLoggedIn,
  verifyToken,
  login as authLogin,
  logout as authLogout,
  exchangeHandoff,
  authHeaders,
  type UserInfo
} from '@/auth/authClient'

// Shared singleton state - all components reference the same reactive state
const sharedAuthState = {
  isLoggedIn: ref(checkIsLoggedIn()),
  username: ref('User'),
  loading: ref(true),
  user: ref<UserInfo | null>(null),
  initialized: ref(false)
}

export function useAuth() {
  // All components get references to the same shared state
  const isLoggedIn = sharedAuthState.isLoggedIn
  const username = sharedAuthState.username
  const loading = sharedAuthState.loading
  const user = sharedAuthState.user
  
  /**
   * Check URL for handoff code and exchange it for tokens
   */
  async function checkForHandoffCode(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search)
    const handoff = urlParams.get('handoff')
    
    if (!handoff) {
      return false
    }
    
    const success = await exchangeHandoff(handoff)
    
    if (success) {
      // Remove handoff from URL
      urlParams.delete('handoff')
      const newUrl = window.location.pathname + 
        (urlParams.toString() ? `?${urlParams.toString()}` : '') + 
        window.location.hash
      window.history.replaceState({}, '', newUrl)
      
      // Update shared state (all components will see this)
      sharedAuthState.isLoggedIn.value = true
      await checkAuth()
      // Notify all components of auth state change
      window.dispatchEvent(new Event('auth:update'))
      return true
    }
    
    return false
  }
  
  /**
   * Check authentication status via Authorization header
   */
  const checkAuth = async (): Promise<boolean> => {
    sharedAuthState.loading.value = true
    
    const result = await verifyToken()
    
    if (result.valid && result.user) {
      sharedAuthState.isLoggedIn.value = true
      sharedAuthState.user.value = result.user
      sharedAuthState.username.value = result.user.username || result.user.email?.split('@')[0] || 'User'
    } else {
      sharedAuthState.isLoggedIn.value = false
      sharedAuthState.user.value = null
      sharedAuthState.username.value = 'User'
    }
    
    sharedAuthState.loading.value = false
    return result.valid
  }

  /**
   * Initiate login - redirect to Auth SPA
   */
  const login = async () => {
    authLogin(window.location.href)
  }

  /**
   * Logout - clear tokens and redirect to Auth SPA logout
   */
  const logout = async () => {
    sharedAuthState.isLoggedIn.value = false
    sharedAuthState.username.value = 'User'
    sharedAuthState.user.value = null
    authLogout()
  }

  // Storage event listener to sync auth state across tabs
  const handleStorageChange = async (e: StorageEvent) => {
    if (e.key === '4ai_access_token' || e.key === '4ai_id_token' || e.key === '4ai_expires_at') {
      // Token changed in another tab, update shared auth state
      if (checkIsLoggedIn()) {
        await checkAuth()
      } else {
        sharedAuthState.isLoggedIn.value = false
        sharedAuthState.user.value = null
        sharedAuthState.username.value = 'User'
      }
    }
  }

  // Custom event listener for same-tab token updates (handoff code exchange)
  const handleAuthUpdate = async () => {
    if (checkIsLoggedIn()) {
      await checkAuth()
    } else {
      sharedAuthState.isLoggedIn.value = false
      sharedAuthState.user.value = null
      sharedAuthState.username.value = 'User'
    }
  }

  // Initialize auth state only once (first component to mount)
  onMounted(async () => {
    // Listen for storage changes (tokens updated in other tabs)
    window.addEventListener('storage', handleStorageChange)
    // Listen for custom auth update events (same tab)
    window.addEventListener('auth:update', handleAuthUpdate)
    
    // Only initialize once (first component)
    if (!sharedAuthState.initialized.value) {
      sharedAuthState.initialized.value = true
      
      // Check for handoff code first (user just logged in)
      const hasHandoff = await checkForHandoffCode()
      if (hasHandoff) {
        // Notify other components
        window.dispatchEvent(new Event('auth:update'))
        return
      }
      
      // Check existing token
      if (checkIsLoggedIn()) {
        await checkAuth()
      } else {
        sharedAuthState.loading.value = false
      }
    } else {
      // Component mounted after initialization, just sync state
      if (checkIsLoggedIn() && !sharedAuthState.isLoggedIn.value) {
        await checkAuth()
      } else if (!checkIsLoggedIn() && sharedAuthState.isLoggedIn.value) {
        sharedAuthState.isLoggedIn.value = false
        sharedAuthState.user.value = null
        sharedAuthState.username.value = 'User'
      }
    }
  })

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener('auth:update', handleAuthUpdate)
  })

  return {
    isLoggedIn,
    username,
    loading,
    user,
    checkAuth,
    login,
    logout
  }
}

// Re-export auth headers for API calls
export { authHeaders }
