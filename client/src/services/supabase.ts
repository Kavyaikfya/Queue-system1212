import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('your-project.supabase.co') &&
  supabaseUrl.startsWith('https://');

export const supabase: SupabaseClient = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder-domain-fairqueue.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  role: 'user' | 'staff' | 'organization_admin' | 'super_admin';
  theme_preference: 'light' | 'dark' | 'system';
  created_at?: string;
  updated_at?: string;
}

/**
 * Ensures a profile row exists in public.profiles for the authenticated Google user.
 * Pulls metadata directly from Google OAuth identity.
 */
export async function ensureUserProfile(user: SupabaseUser): Promise<UserProfile> {
  const metadata = user.user_metadata || {};
  const googleName =
    metadata.full_name ||
    metadata.name ||
    user.email?.split('@')[0] ||
    'Google User';
  const googleAvatar =
    metadata.avatar_url ||
    metadata.picture ||
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

  const fallbackProfile: UserProfile = {
    id: user.id,
    email: user.email || '',
    display_name: googleName,
    avatar_url: googleAvatar,
    role: 'user',
    theme_preference: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!isConfigured) {
    // Save to local storage cache for instant reactive UI
    const existing = localStorage.getItem(`fq_profile_${user.id}`);
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(`fq_profile_${user.id}`, JSON.stringify(fallbackProfile));
    return fallbackProfile;
  }

  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile && !fetchErr) {
      return existingProfile as UserProfile;
    }

    // Insert new profile
    const { data: newProfile, error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        display_name: googleName,
        avatar_url: googleAvatar,
        role: 'user',
        theme_preference: 'system',
      })
      .select()
      .single();

    if (newProfile && !insertErr) {
      return newProfile as UserProfile;
    }
  } catch (err) {
    console.warn('[Supabase] Profile lookup/sync error, using fallback profile:', err);
  }

  return fallbackProfile;
}

/**
 * Initiate Google OAuth Sign-In via Supabase
 */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  if (!isConfigured) {
    // Emulate realistic Google OAuth authentication for local development/sandbox
    console.info('[Supabase] Running simulated Google OAuth session for local sandbox.');
    const mockUser: SupabaseUser = {
      id: 'google-user-7729',
      app_metadata: { provider: 'google' },
      user_metadata: {
        full_name: 'Alex Morgan',
        name: 'Alex Morgan',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        email: 'alex.morgan.fairqueue@gmail.com',
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'alex.morgan.fairqueue@gmail.com',
    } as any;

    const profile = await ensureUserProfile(mockUser);
    localStorage.setItem('fq_session_user', JSON.stringify(mockUser));
    localStorage.setItem('fq_profile', JSON.stringify(profile));
    localStorage.setItem('fq_token', 'mock-google-oauth-jwt-token');

    // Trigger storage event for reactivity
    window.dispatchEvent(new Event('fq_auth_change'));
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Sign out user session
 */
export async function signOut(): Promise<{ error: Error | null }> {
  localStorage.removeItem('fq_session_user');
  localStorage.removeItem('fq_profile');
  localStorage.removeItem('fq_token');
  window.dispatchEvent(new Event('fq_auth_change'));

  if (!isConfigured) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Retrieve active session
 */
export async function getSession(): Promise<{ session: Session | null; error: Error | null }> {
  if (!isConfigured) {
    const savedUser = localStorage.getItem('fq_session_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        const mockSession: Session = {
          access_token: 'mock-google-oauth-jwt-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: u,
        };
        return { session: mockSession, error: null };
      } catch {
        return { session: null, error: null };
      }
    }
    return { session: null, error: null };
  }

  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session || null, error: error as Error | null };
}

/**
 * Listen for authentication changes
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  if (!isConfigured) {
    const handler = () => {
      getSession().then(({ session }) => {
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      });
    };
    window.addEventListener('fq_auth_change', handler);
    return {
      data: {
        subscription: {
          unsubscribe: () => window.removeEventListener('fq_auth_change', handler),
        },
      },
    };
  }

  return supabase.auth.onAuthStateChange(callback);
}
