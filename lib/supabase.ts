import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Use placeholder values if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export function createClient() {
  // Check if we have real Supabase credentials
  const hasRealCredentials =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")

  if (!hasRealCredentials) {
    console.warn("Supabase credentials not configured. Using mock client.")
    // Return a mock client for development
    return createMockSupabaseClient()
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Mock Supabase client for development when credentials aren't set
function createMockSupabaseClient() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      insert: () => ({
        select: () =>
          Promise.resolve({
            data: [{ id: "mock-id-" + Math.random().toString(36).substr(2, 9) }],
            error: null,
          }),
      }),
      select: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
    }),
  } as any
}
