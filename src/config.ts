/**
 * Centralized Configuration
 * 
 * All API URLs and external service endpoints are configured here.
 * Environment variable is required - build will fail if not present.
 */

// Domain from environment variable (e.g., "4aitek.com")
const domain = import.meta.env.VITE_API_BASE_URL
if (!domain) {
  throw new Error('VITE_API_BASE_URL environment variable is required')
}

// Construct all URLs from domain
const authOrigin = `https://auth.${domain}`
const authApiUrl = `https://login.api.${domain}`
const creditsApiUrl = `https://credits.api.${domain}`
const talentApiUrl = `https://talent.api.${domain}`
const accountsApiUrl = `https://accounts.api.${domain}`
const patentApiUrl = `https://patent.api.${domain}`

export const config = {
  authOrigin,
  authApiUrl,
  creditsApiUrl,
  talentApiUrl,
  accountsApiUrl,
  patentApiUrl,
}

