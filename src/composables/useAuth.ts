/**
 * Talent4AI - Authentication Composable
 * 
 * JWT-based authentication using Authorization headers.
 * Delegates login to the centralized Auth SPA (auth.4aitek.com).
 * Agreement check is handled by Auth SPA before redirect.
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

export function useAuth() {
  const isLoggedIn = ref(checkIsLoggedIn())
  const username = ref('User')
  const loading = ref(true)
  const user = ref<UserInfo | null>(null)
  
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
      
      // Update state
      isLoggedIn.value = true
      await checkAuth()
      return true
    }
    
    return false
  }
  
  /**
   * Check authentication status via Authorization header
   */
  const checkAuth = async (): Promise<boolean> => {
    loading.value = true
    
    const result = await verifyToken()
    
    if (result.valid && result.user) {
      isLoggedIn.value = true
      user.value = result.user
      username.value = result.user.username || result.user.email?.split('@')[0] || 'User'
    } else {
      isLoggedIn.value = false
      user.value = null
      username.value = 'User'
    }
    
    loading.value = false
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
    isLoggedIn.value = false
    username.value = 'User'
    user.value = null
    authLogout()
  }

  // Storage event listener to sync auth state across tabs
  const handleStorageChange = async (e: StorageEvent) => {
    if (e.key === '4ai_access_token' || e.key === '4ai_id_token' || e.key === '4ai_expires_at') {
      // Token changed in another tab, update auth state
      if (checkIsLoggedIn()) {
        await checkAuth()
      } else {
        isLoggedIn.value = false
        user.value = null
        username.value = 'User'
      }
    }
  }

  // Single auth check on mount
  onMounted(async () => {
    // Listen for storage changes (tokens updated in other tabs)
    window.addEventListener('storage', handleStorageChange)
    
    // Check for handoff code first (user just logged in)
    const hasHandoff = await checkForHandoffCode()
    if (hasHandoff) {
      return
    }
    
    // Check existing token
    if (checkIsLoggedIn()) {
      await checkAuth()
    } else {
      loading.value = false
    }
  })

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange)
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
