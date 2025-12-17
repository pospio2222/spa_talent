/**
 * Talent4AI - Authentication Composable
 * Uses HTTP-only cookies shared across *.4aitek.com subdomains
 * Callback always goes through 4aitek.com for first-party cookie context
 */

import { ref, onMounted } from 'vue'
import api, { setAuthStateUpdater } from '@/utils/api'

const API_URL = 'https://login.api.4aitek.com'
const COGNITO_REDIRECT_URI = 'https://4aitek.com'
const RETURN_URL_KEY = '4aitek_return_url'

// Cookie helpers for cross-subdomain return URL
function setReturnUrlCookie(url: string) {
  const maxAge = 60 * 10 // 10 minutes
  document.cookie = `${RETURN_URL_KEY}=${encodeURIComponent(url)}; domain=.4aitek.com; path=/; max-age=${maxAge}; secure; samesite=lax`
}

function clearReturnUrlCookie() {
  document.cookie = `${RETURN_URL_KEY}=; domain=.4aitek.com; path=/; max-age=0; secure; samesite=lax`
}

export interface AuthState {
  isLoggedIn: boolean
  username: string
  loading: boolean
  userAgreement: boolean
}

export function useAuth() {
  const isLoggedIn = ref(false)
  const username = ref('User')
  const loading = ref(true)
  const userAgreement = ref(true) // Default to true to avoid blocking

  /**
   * Check authentication status via cookie
   */
  const checkAuth = async (): Promise<boolean> => {
    try {
      const res = await api.get(`${API_URL}/verify`)
      
      if (res.data.valid) {
        isLoggedIn.value = true
        username.value = res.data.username || 'User'
        userAgreement.value = res.data.user_agreement ?? true
        loading.value = false
        return true
      }
      
      isLoggedIn.value = false
      username.value = 'User'
      userAgreement.value = true
      loading.value = false
      return false
    } catch (err) {
      console.error('Auth check failed:', err)
      isLoggedIn.value = false
      username.value = 'User'
      userAgreement.value = true
      loading.value = false
      return false
    }
  }

  /**
   * Initiate Cognito login
   * Stores current URL in cookie, redirects through main domain
   */
  const login = async () => {
    try {
      // Store current URL to return after login
      setReturnUrlCookie(window.location.href)
      
      // Always redirect through main domain for first-party cookie context
      const res = await api.get(`${API_URL}/cognito-login-url`, {
        params: { redirect_uri: COGNITO_REDIRECT_URI }
      })
      
      if (res.data.login_url) {
        window.location.href = res.data.login_url
      } else {
        throw new Error('No login URL in response')
      }
    } catch (err) {
      console.error('Failed to get login URL:', err)
      window.location.href = API_URL
    }
  }

  /**
   * Logout and clear cookies
   */
  const logout = async () => {
    try {
      await api.post(`${API_URL}/logout`)
      
      isLoggedIn.value = false
      username.value = 'User'
      clearReturnUrlCookie()
      window.location.href = '/'
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  // Register auth state updater for 401 interceptor
  setAuthStateUpdater((loggedIn: boolean) => {
    isLoggedIn.value = loggedIn
    if (!loggedIn) {
      username.value = 'User'
    }
  })

  // Check auth on mount (callback handling happens on main domain only)
  onMounted(checkAuth)

  return {
    isLoggedIn,
    username,
    loading,
    userAgreement,
    checkAuth,
    login,
    logout
  }
}

