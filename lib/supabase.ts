import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Silently clean up any stale session that the SDK can't refresh.
// This prevents recurring "Invalid Refresh Token" console errors
// from the SDK's internal auto-refresh timer while keeping valid
// sessions intact.
if (typeof window !== 'undefined' && supabase) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      supabase.auth.signOut().catch(() => {});
    }
  });
}

// Server-side Supabase client with service role key
export const supabaseServer = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
