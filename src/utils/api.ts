/**
 * Axios instance with Authorization header and 401 interceptor
 * 
 * JWT-based authentication - no cookies.
 */
import axios from 'axios'
import { authHeaders, clearTokens } from '@/auth/authClient'

let authStateUpdater: ((loggedIn: boolean) => void) | null = null

// Create axios instance (no credentials needed - using headers)
const api = axios.create()

// Request interceptor - add Authorization header
api.interceptors.request.use(
  (config) => {
    const headers = authHeaders()
    if (headers.Authorization) {
      config.headers.Authorization = headers.Authorization
    }
    return config
  },
  (err) => Promise.reject(err)
)

// Response interceptor - handle 401 errors
// IMPORTANT: Do NOT auto-redirect to login on 401!
// This causes infinite loops. Let the user manually click login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    const url = err?.config?.url || ''

    if (status === 401) {
      // Skip token clearing for /verify endpoint - 401 just means "not logged in yet"
      const isVerifyEndpoint = url.includes('/verify')
      
      if (!isVerifyEndpoint) {
        clearTokens()
        
        if (authStateUpdater) {
          authStateUpdater(false)
        }
      }
      
      return Promise.reject(err)
    }

    return Promise.reject(err)
  }
)

/**
 * Register auth state updater callback
 */
export function setAuthStateUpdater(updater: (loggedIn: boolean) => void) {
  authStateUpdater = updater
}

export default api
