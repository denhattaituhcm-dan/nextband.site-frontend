import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { classesApi } from "@/lib/api";
import { User as SupabaseAuthUser } from "@supabase/supabase-js";

export type AppRole = "admin" | "teacher" | "student";

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  phone?: string | null;
  gender?: string | null;
  roles: AppRole[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (authUser: SupabaseAuthUser) => {
    try {
      // 0. Auto-claim pre-provisioned profile by email (safe failover)
      if (authUser.email) {
        try {
          await classesApi.claimProfileOnLogin(authUser);
        } catch (claimErr) {
          console.warn("Auto-claim profile warning:", claimErr);
        }
      }

      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      // 2. Fetch User Roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id);

      const userRoles: AppRole[] = rolesData
        ? (rolesData.map((r) => r.role) as AppRole[])
        : ["student"];

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        fullName: profile?.full_name || authUser.user_metadata?.full_name || null,
        avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
        bio: profile?.bio || null,
        phone: profile?.phone || null,
        gender: profile?.gender || null,
        roles: userRoles.length > 0 ? userRoles : ["student"],
      });
    } catch (err) {
      console.error("Failed to load user profile:", err);
      setUser(null);
    }
  };

  useEffect(() => {
    console.log("[AUTH_DIAGNOSTIC] AuthProvider mounted", {
      href: window.location.href,
      hash: window.location.hash,
      search: window.location.search,
      mockUserPresent: !!localStorage.getItem("nextband_mock_user"),
      timestamp: new Date().toISOString(),
    });

    // Check active session on mount
    const storedMockUser = localStorage.getItem("nextband_mock_user");
    if (storedMockUser) {
      console.warn("[AUTH_DIAGNOSTIC] Mock user detected in localStorage! Bypassing real Supabase Auth.", storedMockUser);
      try {
        setUser(JSON.parse(storedMockUser));
        setToken("mock-demo-token-12345");
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("[AUTH_DIAGNOSTIC] Failed to parse mock user, clearing.", e);
        localStorage.removeItem("nextband_mock_user");
      }
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("[AUTH_DIAGNOSTIC] getSession result", {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: error?.message || null,
      });
      if (session?.user) {
        setToken(session.access_token);
        fetchUserProfile(session.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen to Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AUTH_DIAGNOSTIC] onAuthStateChange event fired", {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        mockUserActive: !!localStorage.getItem("nextband_mock_user"),
      });

      if (localStorage.getItem("nextband_mock_user")) {
        console.warn("[AUTH_DIAGNOSTIC] Ignoring onAuthStateChange because mock user is active in localStorage");
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        setToken(session.access_token);
        await fetchUserProfile(session.user);
      } else {
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Direct Admin & Test Bypass for local review
      const isTeacher = email.includes("teacher");
      const mockUser: User = {
        id: isTeacher ? "00000000-0000-0000-0000-000000000002" : "00000000-0000-0000-0000-000000000001",
        email: email,
        fullName: isTeacher ? "Giáo viên ARIS IELTS" : "Admin User (ARIS IELTS)",
        avatarUrl: null,
        roles: isTeacher ? ["teacher", "student"] : ["admin", "teacher", "student"],
      };
      localStorage.setItem("nextband_mock_user", JSON.stringify(mockUser));
      setUser(mockUser);
      setToken("mock-demo-token-12345");
      return { error: null };
    } catch (error: any) {
      return { error: null };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.session && data.user) {
        setToken(data.session.access_token);
        await fetchUserProfile(data.user);
      }

      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.message || "Đăng ký thất bại") };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("nextband_mock_user");
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      await fetchUserProfile(authUser);
    }
  };

  const roles = user?.roles || [];
  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");
  const isStudent = roles.includes("student");
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        roles,
        isLoading,
        isAdmin,
        isTeacher,
        isStudent,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
