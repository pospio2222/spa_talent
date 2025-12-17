/**
 * Axios instance with 401 interceptor for automatic logout
 * Note: /verify 401s are ignored - they indicate "not logged in" not "session expired"
 */
import axios from 'axios'

let authStateUpdater: ((loggedIn: boolean) => void) | null = null

// Create axios instance with credentials
const api = axios.create({
  withCredentials: true
})

// Response interceptor - handle 401 errors on protected APIs only
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    const url = err?.config?.url || ''

    if (status === 401) {
      // Skip logout for /verify endpoint - 401 just means "not logged in yet"
      // Only trigger logout for protected API 401s (session expired mid-use)
      const isVerifyEndpoint = url.includes('/verify')
      
      if (!isVerifyEndpoint && authStateUpdater) {
        authStateUpdater(false)
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
