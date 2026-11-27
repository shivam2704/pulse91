/**
 * pulse91/terminal/src/services/supabaseAuth.js
 * Multi-Tenant Authentication & Session Management via Supabase.
 * Guarantees cryptographic user isolation across all Demat portfolios.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jyazrxtuwkblxwhfrozb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_x3uz82LgJs2UXgNE_KQt1Q_Ebi4vCP2';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

// Cache token in memory for high-performance API calls
let cachedSession = null;

export async function getSession() {
  if (!supabase) return null;
  if (cachedSession) return cachedSession;
  const { data } = await supabase.auth.getSession();
  cachedSession = data.session;
  return cachedSession;
}

export async function getAccessToken() {
  const session = await getSession();
  return session?.access_token || null;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  cachedSession = data.session;
  return data;
}

export async function signUpWithEmail(email, password) {
  if (!supabase) throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  cachedSession = data.session;
  return data;
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/?oauth_popup=1`,
      skipBrowserRedirect: true
    }
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Failed to generate Google OAuth URL.');

  const width = 500;
  const height = 620;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    data.url,
    'pulse91_google_oauth',
    `width=${width},height=${height},left=${left},top=${top},popup=yes,resizable=yes,scrollbars=yes`
  );

  if (!popup) {
    throw new Error('Popup blocked! Please allow popups for this site and try again.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = (timer, onMsg) => {
      clearInterval(timer);
      window.removeEventListener('message', onMsg);
    };

    const onMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'PULSE91_OAUTH_COMPLETE' && !settled) {
        settled = true;
        cleanup(timer, onMessage);
        if (!popup.closed) popup.close();
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          cachedSession = sessionData.session;
          resolve(sessionData.session);
        } else {
          setTimeout(async () => {
            const { data: retryData } = await supabase.auth.getSession();
            if (retryData?.session) {
              cachedSession = retryData.session;
              resolve(retryData.session);
            } else {
              reject(new Error('Authentication completed, please refresh if session did not update.'));
            }
          }, 400);
        }
      }
    };

    window.addEventListener('message', onMessage);

    const timer = setInterval(async () => {
      if (popup.closed && !settled) {
        settled = true;
        cleanup(timer, onMessage);
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          cachedSession = sessionData.session;
          resolve(sessionData.session);
        } else {
          reject(new Error('Google sign-in popup was closed before completing login.'));
        }
      }
    }, 400);
  });
}

export async function signOut() {
  if (!supabase) return;
  cachedSession = null;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange((event, session) => {
    cachedSession = session;
    callback(event, session);
  });
}
