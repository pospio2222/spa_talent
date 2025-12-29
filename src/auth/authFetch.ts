/**
 * Auth Fetch Helper
 * 
 * Wraps the native fetch API to automatically:
 * - Add Authorization header to all requests
 * - Handle 401 responses by clearing tokens and redirecting to login
 */

import { authHeaders, clearTokens, AUTH_API_URL } from './authClient'

/**
 * Fetch with automatic Authorization header
 * 
 * Usage:
 *   const response = await authFetch('/api/data')
 *   const data = await response.json()
 * 
 * @param input - URL or Request object
 * @param init - Fetch options
 * @returns Promise<Response>
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Merge auth headers with any provided headers
  const headers = {
    ...authHeaders(),
    ...init?.headers
  }
  
  const response = await fetch(input, {
    ...init,
    headers
  })
  
  // Handle 401 Unauthorized
  // IMPORTANT: Do NOT auto-redirect to login on 401!
  // This causes infinite loops. Let the user manually click login.
  if (response.status === 401) {
    const url = typeof input === 'string' ? input : input.toString()
    const isVerifyEndpoint = url.includes('/verify')
    
    if (!isVerifyEndpoint) {
      clearTokens()
    }
  }
  
  return response
}

/**
 * Convenience function for GET requests
 */
export async function authGet<T>(url: string): Promise<T> {
  const response = await authFetch(url)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Convenience function for POST requests
 */
export async function authPost<T>(url: string, data: unknown): Promise<T> {
  const response = await authFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

// Re-export AUTH_API_URL for convenience
export { AUTH_API_URL }
