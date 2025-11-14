/**
 * Patent4AI - Authentication Composable
 * Uses HTTP-only cookies shared across *.4aitek.com subdomains
 */

import { ref, onMounted } from 'vue'

const API_URL = 'https://login.4aitek.com'

// Use main domain for redirect URI (already registered in Cognito)
const REDIRECT_URI = 'https://4aitek.com'

// Detect if running locally (localhost or IP address)
const isLocal = () => {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
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
    // Bypass auth for local/EC2 testing
    if (isLocal()) {
      isLoggedIn.value = true
      username.value = 'Test User'
      loading.value = false
      return true
    }

    try {
      const res = await fetch(`${API_URL}/verify`, {
        credentials: 'include'
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.valid) {
          isLoggedIn.value = true
          username.value = data.username || 'User'
          loading.value = false
          return true
        }
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
      const res = await fetch(`${API_URL}/auth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
      })

      if (!res.ok) {
        throw new Error(`Token exchange failed: ${res.statusText}`)
      }

      const data = await res.json()
      
      if (data.success) {
        await checkAuth()
        return { success: true }
      } else {
        throw new Error(data.message || 'Token exchange failed')
      }
    } catch (err) {
      console.error('Login failed:', err)
      return { success: false, error: (err as Error).message }
    }
  }

  /**
   * Initiate Cognito login
   */
  const login = async () => {
    try {
      const res = await fetch(`${API_URL}/cognito-login-url?redirect_uri=${encodeURIComponent(REDIRECT_URI)}`)
      const data = await res.json()
      
      if (data.login_url) {
        window.location.href = data.login_url
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
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      
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
      // If redirected from main domain, go back to patent subdomain (production only)
      if (window.location.hostname === '4aitek.com') {
        window.location.href = 'https://patent.4aitek.com' + window.location.pathname
        return
      }
      // Clean URL after processing (local or production)
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    // Check authentication status
    await checkAuth()
  }

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

