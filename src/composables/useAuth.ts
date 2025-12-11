/**
 * Patent4AI - Authentication Composable
 * Uses HTTP-only cookies shared across *.4aitek.com subdomains
 */

import { ref, onMounted } from 'vue'
import api, { setAuthStateUpdater } from '@/utils/api'

const API_URL = 'https://login.api.4aitek.com'

// Use current app's domain for redirect URI
const getRedirectUri = () => {
  if (typeof window === 'undefined') return 'https://talent.4aitek.com'
  return `https://${window.location.hostname}`
}

export interface AuthState {
  isLoggedIn: boolean
  username: string
  loading: boolean
}

export function useAuth() {
  const isLoggedIn = ref(false)
  const username = ref('User')
  const loading = ref(true)

  /**
   * Check authentication status via cookie
   */
  const checkAuth = async (): Promise<boolean> => {
    try {
      const res = await api.get(`${API_URL}/verify`)
      
      if (res.data.valid) {
        isLoggedIn.value = true
        username.value = res.data.username || 'User'
        loading.value = false
        return true
      }
      
      isLoggedIn.value = false
      username.value = 'User'
      loading.value = false
      return false
    } catch (err) {
      console.error('Auth check failed:', err)
      isLoggedIn.value = false
      username.value = 'User'
      loading.value = false
      return false
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  const exchangeToken = async (code: string) => {
    try {
      const res = await api.post(`${API_URL}/auth/callback`, {
        code,
        redirect_uri: getRedirectUri()
      })
      
      if (res.data.success) {
        await checkAuth()
        return { success: true }
      } else {
        throw new Error(res.data.message || 'Token exchange failed')
      }
    } catch (err: any) {
      console.error('Login failed:', err)
      return { success: false, error: err?.response?.data?.detail || err?.message || 'Token exchange failed' }
    }
  }

  /**
   * Initiate Cognito login
   */
  const login = async () => {
    try {
      // Use current app's domain for redirect
      const redirectUri = getRedirectUri()
      const res = await api.get(`${API_URL}/cognito-login-url`, {
        params: { redirect_uri: redirectUri }
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
      window.location.href = '/'
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  /**
   * Handle OAuth callback
   */
  const handleCallback = async () => {
    // Handle OAuth callback if code present
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      loading.value = true
      await exchangeToken(code)
      // Redirect to current app's domain after successful login
      const currentHost = window.location.hostname
      if (currentHost === '4aitek.com') {
        // If on main domain, redirect to talent subdomain
        window.location.href = 'https://talent.4aitek.com' + (window.location.pathname || '/')
        return
      }
      // Clean URL after processing (remove code parameter)
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    // Check authentication status
    await checkAuth()
  }

  // Register auth state updater for 401 interceptor
  setAuthStateUpdater((loggedIn: boolean) => {
    isLoggedIn.value = loggedIn
    if (!loggedIn) {
      username.value = 'User'
    }
  })

  onMounted(handleCallback)

  return {
    isLoggedIn,
    username,
    loading,
    checkAuth,
    login,
    logout
  }
}

