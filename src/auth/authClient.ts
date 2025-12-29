/**
 * Auth Client - Token Storage and Management
 * 
 * This module handles:
 * - Storing tokens in sessionStorage
 * - Retrieving tokens for API calls
 * - Login/logout redirects to Auth SPA
 * 
 * SECURITY NOTES:
 * - Tokens are stored in sessionStorage (cleared on tab close)
 * - Never use localStorage for tokens (XSS risk)
 * - Always use Authorization headers, never cookies
 */

// Auth SPA URL
const AUTH_SPA_URL = import.meta.env.PROD
  ? 'https://auth.4aitek.com'
  : 'http://localhost:5175'

// Backend API URL
export const AUTH_API_URL = import.meta.env.PROD
  ? 'https://login.api.4aitek.com'
  : 'http://localhost:7000'

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: '4ai_access_token',
  ID_TOKEN: '4ai_id_token',
  EXPIRES_AT: '4ai_expires_at'
} as const

// Token response from Auth SPA handoff code exchange
export interface AuthTokens {
  access_token: string
  id_token: string
  expires_in: number
}

// User info from /verify
export interface UserInfo {
  sub: string
  email: string | null
  username: string | null
}

/**
 * Save tokens to sessionStorage
 */
export function saveTokens(tokens: AuthTokens): void {
  const expiresAt = Date.now() + (tokens.expires_in * 1000)
  
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token)
  sessionStorage.setItem(STORAGE_KEYS.ID_TOKEN, tokens.id_token)
  sessionStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString())
}

/**
 * Clear all tokens from sessionStorage
 */
export function clearTokens(): void {
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  sessionStorage.removeItem(STORAGE_KEYS.ID_TOKEN)
  sessionStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
}

/**
 * Get access token (for Authorization header)
 */
export function getAccessToken(): string | null {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  const expiresAt = sessionStorage.getItem(STORAGE_KEYS.EXPIRES_AT)
  
  // Check if token exists and is not expired
  if (token && expiresAt) {
    if (Date.now() < parseInt(expiresAt, 10)) {
      return token
    }
    // Token expired, clear storage
    clearTokens()
  }
  
  return null
}

/**
 * Get ID token (contains user claims)
 */
export function getIdToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.ID_TOKEN)
}

/**
 * Check if user is logged in (has valid token)
 */
export function isLoggedIn(): boolean {
  return getAccessToken() !== null
}

/**
 * Get Authorization header object for fetch/axios
 * Uses id_token for API calls because:
 * - id_token has both 'sub' (cognito_sub) and 'email'
 * - Allows fallback user lookup by email when cognito_sub is not set in DB
 * - access_token only has 'sub', no email, so can't match users without cognito_sub
 */
export function authHeaders(): Record<string, string> {
  const token = getIdToken()
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

/**
 * Redirect to Auth SPA for login (same-tab redirect, no popup)
 * 
 * @param returnUrl - URL to return to after login (defaults to current page)
 */
export function login(returnUrl?: string): void {
  const url = returnUrl || window.location.href
  const loginUrl = `${AUTH_SPA_URL}/login?return=${encodeURIComponent(url)}`
  
  // Same-tab redirect (no popup)
  window.location.href = loginUrl
}

/**
 * Logout - clear tokens and redirect to Auth SPA logout
 */
export function logout(): void {
  clearTokens()
  
  // Redirect to Auth SPA logout (which will clear Cognito session)
  const logoutUri = encodeURIComponent(window.location.origin)
  window.location.href = `${AUTH_SPA_URL}/logout?logout_uri=${logoutUri}`
}

/**
 * Exchange handoff code for tokens
 * 
 * @param handoff - The handoff code from URL query param
 */
export async function exchangeHandoff(handoff: string): Promise<boolean> {
  try {
    const response = await fetch(`${AUTH_API_URL}/auth/exchange-handoff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ handoff })
    })
    
    if (!response.ok) {
      return false
    }
    
    const tokens = await response.json()
    
    // Save tokens
    saveTokens({
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      expires_in: tokens.expires_in
    } as AuthTokens)
    
    return true
    
  } catch (err) {
    return false
  }
}

/**
 * Verify token with backend and get user info
 * Uses id_token for /verify (contains user claims like email)
 */
export async function verifyToken(): Promise<{ valid: boolean; user?: UserInfo }> {
  const token = getIdToken()
  
  if (!token) {
    return { valid: false }
  }
  
  try {
    const response = await fetch(`${AUTH_API_URL}/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!response.ok) {
      clearTokens()
      return { valid: false }
    }
    
    const data = await response.json()
    
    if (data.valid && data.user) {
      return { valid: true, user: data.user }
    }
    
    clearTokens()
    return { valid: false }
    
  } catch (err) {
    console.error('Token verification failed:', err)
    return { valid: false }
  }
}
