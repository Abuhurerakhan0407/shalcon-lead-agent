import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://puzuizdhjeohgvbcnxkh.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_UTSFJ_SIx5JfzP4LsXP0Bw_anWgHiiv';

let client: any = null;

export function supabaseBrowser(): any {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });

  const originalSignUp = client.auth.signUp.bind(client.auth);
  client.auth.signUp = (credentials: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    if (!origin) return originalSignUp(credentials);
    const options = credentials?.options || {};
    return originalSignUp({
      ...credentials,
      options: {
        ...options,
        emailRedirectTo: options.emailRedirectTo || origin,
      },
    });
  };

  return client;
}
