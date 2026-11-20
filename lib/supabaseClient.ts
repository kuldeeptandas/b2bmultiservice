// Supabase Client & REST API Integration
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znczgsciibtihbjrokro.supabase.co').trim().replace(/\/$/, ''),
    anonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_G3gBkdWcOFEjoJc0WYVJOQ_ke5hhQ4V').trim(),
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    !url.includes('your-project') &&
    anonKey.length > 20
  );
}

let _supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!_supabaseClient) {
    const { url, anonKey } = getSupabaseConfig();
    _supabaseClient = createClient(url, anonKey);
  }
  return _supabaseClient;
}

// Low-level Supabase REST API helper (uses standard fetch, works in any environment)
export async function supabaseRestFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { url, anonKey } = getSupabaseConfig();
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase is not configured yet', status: 400 };
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${url}/rest/v1${cleanEndpoint}`;

  const headers: Record<string, string> = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg = typeof data === 'object' && data?.message ? data.message : res.statusText || 'Supabase request failed';
      return { data: null, error: msg, status: res.status };
    }

    return { data, error: null, status: res.status };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Network error reaching Supabase', status: 500 };
  }
}
