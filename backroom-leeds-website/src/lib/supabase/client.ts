/**
 * Supabase Browser Client Configuration
 * 
 * This client is designed for client-side usage in Client Components,
 * browser interactions, and real-time subscriptions using @supabase/ssr
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * Creates a Supabase client configured for browser usage
 * Singleton pattern ensures one client instance per application
 */
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return client
}

/**
 * Export the client instance directly for convenience
 * This is the recommended approach for client-side usage
 */
export const supabase = createClient()

/**
 * Helper function to check if we're running in the browser
 * Useful for components that might run on both server and client
 */
export const isBrowser = typeof window !== 'undefined'

/**
 * Helper function to get user session from browser client
 * Returns null if not authenticated
 */
export async function getSession() {
  if (!isBrowser) return null
  
  const { data, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  
  return data.session
}

/**
 * Helper function to get current user from browser client
 * Returns null if not authenticated
 */
export async function getUser() {
  if (!isBrowser) return null
  
  const { data, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return data.user
}