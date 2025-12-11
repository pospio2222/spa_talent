/**
 * Axios instance with 401 interceptor for automatic logout
 */
import axios from 'axios'

let authStateUpdater: ((loggedIn: boolean) => void) | null = null

// Create axios instance with credentials
const api = axios.create({
  withCredentials: true
})

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status

    if (status === 401) {
      // Update auth state to trigger login page
      if (authStateUpdater) {
        authStateUpdater(false)
      }
      // Redirect to login required page
      if (typeof window !== 'undefined') {
        window.location.href = '/login-required'
      }
      // Stop promise chain
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
