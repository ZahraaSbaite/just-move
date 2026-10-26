import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Without credentials the store runs in demo mode on sample data.
export const supabase = url && key ? createClient(url, key) : null
export const isDemo = !supabase
