import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  signInWithGoogle as supabaseSignInWithGoogle,
  signOut as supabaseSignOut,
  getSession as supabaseGetSession,
  onAuthStateChange as supabaseOnAuthStateChange,
  ensureUserProfile,
  UserProfile,
} from '../services/supabase';

export interface User {
  id: string;
  email: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'STAFF' | 'USER' | 'user' | 'staff' | 'organization_admin' | 'super_admin';
  phone?: string;
  themePreference?: 'light' | 'dark' | 'system';
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isStaff: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fq_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const savedProfile = localStorage.getItem('fq_profile');
    if (savedProfile) {
      try {
        const p: UserProfile = JSON.parse(savedProfile);
        return {
          id: p.id,
          email: p.email,
          fullName: p.display_name || p.email.split('@')[0],
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
          role: p.role,
          themePreference: p.theme_preference,
        };
      } catch {
        // fallback
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fq_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and listen to Supabase auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { session } = await supabaseGetSession();
        if (session?.user) {
          const profile = await ensureUserProfile(session.user);
          if (isMounted) {
            const mappedUser: User = {
              id: profile.id,
              email: profile.email,
              fullName: profile.display_name,
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
              role: profile.role,
              themePreference: profile.theme_preference,
            };
            setUser(mappedUser);
            setToken(session.access_token);
            localStorage.setItem('fq_user', JSON.stringify(mappedUser));
            localStorage.setItem('fq_token', session.access_token);
          }
        } else if (token) {
          // Verify with backend REST API if existing token present
          try {
            const res = await api.getProfile();
            if (res.user && isMounted) {
              const u: User = {
                id: res.user.id,
                email: res.user.email,
                fullName: res.user.full_name || res.user.fullName,
                displayName: res.user.full_name || res.user.displayName,
                avatarUrl: res.user.avatar_url || res.user.avatarUrl,
                role: res.user.role,
                phone: res.user.phone,
              };
              setUser(u);
              localStorage.setItem('fq_user', JSON.stringify(u));
            }
          } catch {
            // Token expired
            if (isMounted) {
              setUser(null);
              setToken(null);
              localStorage.removeItem('fq_token');
              localStorage.removeItem('fq_user');
            }
          }
        }
      } catch (err) {
        console.warn('[Auth] Auth initialization warning:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabaseOnAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await ensureUserProfile(session.user);
        const mappedUser: User = {
          id: profile.id,
          email: profile.email,
          fullName: profile.display_name,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          themePreference: profile.theme_preference,
        };
        setUser(mappedUser);
        setToken(session.access_token);
        localStorage.setItem('fq_user', JSON.stringify(mappedUser));
        localStorage.setItem('fq_token', session.access_token);
      } else {
        // Logged out
        setUser(null);
        setToken(null);
        localStorage.removeItem('fq_user');
        localStorage.removeItem('fq_token');
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabaseSignInWithGoogle();
      if (error) throw error;
      // In sandbox fallback, retrieve immediate mock session
      const { session } = await supabaseGetSession();
      if (session?.user) {
        const profile = await ensureUserProfile(session.user);
        const mappedUser: User = {
          id: profile.id,
          email: profile.email,
          fullName: profile.display_name,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          themePreference: profile.theme_preference,
        };
        setUser(mappedUser);
        setToken(session.access_token);
        localStorage.setItem('fq_user', JSON.stringify(mappedUser));
        localStorage.setItem('fq_token', session.access_token);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabaseSignOut();
      setUser(null);
      setToken(null);
      localStorage.removeItem('fq_token');
      localStorage.removeItem('fq_user');
      localStorage.removeItem('fq_profile');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    signOut();
  };

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('fq_token', res.token);
    localStorage.setItem('fq_user', JSON.stringify(res.user));
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('fq_token', res.token);
    localStorage.setItem('fq_user', JSON.stringify(res.user));
  };

  const refreshProfile = async () => {
    const { session } = await supabaseGetSession();
    if (session?.user) {
      const profile = await ensureUserProfile(session.user);
      const mappedUser: User = {
        id: profile.id,
        email: profile.email,
        fullName: profile.display_name,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        role: profile.role,
        themePreference: profile.theme_preference,
      };
      setUser(mappedUser);
      localStorage.setItem('fq_user', JSON.stringify(mappedUser));
      return;
    }

    if (token) {
      const res = await api.getProfile();
      if (res.user) {
        const u: User = {
          id: res.user.id,
          email: res.user.email,
          fullName: res.user.full_name || res.user.fullName,
          displayName: res.user.full_name || res.user.displayName,
          avatarUrl: res.user.avatar_url || res.user.avatarUrl,
          role: res.user.role,
          phone: res.user.phone,
        };
        setUser(u);
        localStorage.setItem('fq_user', JSON.stringify(u));
      }
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'super_admin';
  const isOrgAdmin = user?.role === 'ORG_ADMIN' || user?.role === 'organization_admin';
  const isStaff = user?.role === 'STAFF' || user?.role === 'staff';
  const isUser = !isSuperAdmin && !isOrgAdmin && !isStaff;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        signInWithGoogle,
        loginWithGoogle: signInWithGoogle,
        signOut,
        login,
        register,
        logout,
        refreshProfile,
        isSuperAdmin,
        isOrgAdmin,
        isStaff,
        isUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
