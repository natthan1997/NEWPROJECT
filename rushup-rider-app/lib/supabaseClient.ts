import { createClient } from '@supabase/supabase-js'

const getSupabaseConfig = () => {
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '')
  const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

  if (!rawUrl || !rawKey) {
    console.warn('WARNING: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Falling back to build placeholder.')
    return { 
      url: 'https://placeholder-project.supabase.co', 
      key: 'placeholder-key',
      isPlaceholder: true 
    }
  }

  return { url: rawUrl, key: rawKey, isPlaceholder: false }
}

const config = getSupabaseConfig()

export const supabase = createClient(config.url, config.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
