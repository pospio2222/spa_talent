/**
 * Auth Module - Public Exports
 * 
 * JWT-based authentication - no cookies.
 * 
 * Import from '@/auth' to use auth functionality:
 * 
 *   import { authFetch, authGet, authPost } from '@/auth'
 *   import { authHeaders, login, logout } from '@/auth'
 * 
 * Note: useAuth composable is in '@/composables/useAuth' for Vue components
 */

export { authFetch, authGet, authPost, AUTH_API_URL } from './authFetch'
export {
  saveTokens,
  clearTokens,
  getAccessToken,
  getIdToken,
  isLoggedIn,
  authHeaders,
  login,
  logout,
  exchangeHandoff,
  verifyToken,
  type AuthTokens,
  type UserInfo
} from './authClient'
