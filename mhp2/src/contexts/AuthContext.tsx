import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'parent' | 'school' | 'expert' | 'admin';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  organization_name: string | null;
  designation: string | null;
  specialization: string | null;
}

/** Session data from Durga's backend API (/api/v1/general/regular-login) */
export interface BackendUser {
  access_token: string;
  user_id: number;
  username: string;
  user_role: string;
  role_type: string;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  profile_image?: string | null;
  school_id?: number;
  school_name?: string;
}

const BACKEND_SESSION_KEY = 'mhp_backend_session';

/** Map Durga's role_type to our AppRole */
function mapBackendRoleToAppRole(roleType: string): AppRole {
  switch (roleType) {
    case 'SCHOOL_STAFF':
    case 'SCHOOL_ADMIN':
      return 'school';
    case 'CONSULTANT_TEAM':
      return 'expert';
    case 'ADMIN_TEAM':
    case 'ANALYST_TEAM':
    case 'ON_GROUND_TEAM':
    case 'SCREENING_TEAM':
      return 'admin';
    case 'PARENT':
      return 'parent';
    default:
      return 'admin';
  }
}

/** Map URL role + admin team selection to Durga's role_type */
export function mapUrlRoleToBackendRoleType(
  urlRole: string,
  teamRole?: string
): string {
  if (urlRole === 'school') return 'SCHOOL_STAFF';
  if (urlRole === 'expert') return 'CONSULTANT_TEAM';
  if (urlRole === 'admin') {
    switch (teamRole) {
      case 'On Ground Team':
        return 'ON_GROUND_TEAM';
      case 'Screening Team':
        return 'SCREENING_TEAM';
      case 'Analyst Team':
        return 'ANALYST_TEAM';
      case 'Admin Team':
        return 'ADMIN_TEAM';
      default:
        return 'ADMIN_TEAM';
    }
  }
  return 'ADMIN_TEAM';
}

interface AuthContextType {
  /** Supabase Auth user (for parent OTP login) */
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  /** Backend user from Durga's API (for school/expert/admin) */
  backendUser: BackendUser | null;
  /** True if logged in via either Supabase or backend */
  isAuthenticated: boolean;
  /** Supabase email+password sign-in */
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  /** Durga's backend API sign-in (school/expert/admin) */
  signInWithBackend: (
    username: string,
    password: string,
    roleType: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Resolve backend API URL from env */
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  const host = window.location.hostname.toLowerCase();
  if (host.includes('uat')) return 'https://uat-api.myhealthpassport.in';
  return 'https://api.myhealthpassport.in';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      } else if (roleData) {
        setRole(roleData.role as AppRole);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  // --- Restore backend session from sessionStorage on mount ---
  useEffect(() => {
    const stored = sessionStorage.getItem(BACKEND_SESSION_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored) as BackendUser;
        setBackendUser(data);
        setRole(mapBackendRoleToAppRole(data.role_type));
      } catch {
        sessionStorage.removeItem(BACKEND_SESSION_KEY);
      }
    }
  }, []);

  // --- Supabase Auth listener ---
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      } else if (!backendUser) {
        // Only clear role if there's no backend session either
        setProfile(null);
        setRole(null);
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        if (!backendUser) setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /** Supabase email+password sign-in */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  /** Durga's backend API sign-in (school/expert/admin) */
  const signInWithBackend = async (
    username: string,
    password: string,
    roleType: string
  ): Promise<{ error: Error | null }> => {
    try {
      const apiUrl = getApiUrl();
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('role_type', roleType);

      const response = await fetch(
        `${apiUrl}/api/v1/general/regular-login`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!data.status) {
        return {
          error: new Error(data.message || 'Login failed'),
        };
      }

      // Store backend session
      const userData: BackendUser = data.data;
      setBackendUser(userData);
      sessionStorage.setItem(BACKEND_SESSION_KEY, JSON.stringify(userData));

      // Set role from backend response
      const appRole = mapBackendRoleToAppRole(userData.role_type);
      setRole(appRole);

      return { error: null };
    } catch (err) {
      return {
        error: new Error(
          err instanceof Error ? err.message : 'Network error'
        ),
      };
    }
  };

  const signOut = async () => {
    // Clear Supabase session
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);

    // Clear backend session
    setBackendUser(null);
    sessionStorage.removeItem(BACKEND_SESSION_KEY);
  };

  const isAuthenticated = !!user || !!backendUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        backendUser,
        isAuthenticated,
        signIn,
        signInWithBackend,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
