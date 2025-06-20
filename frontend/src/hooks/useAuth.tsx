import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface User {
  username?: string;
  email?: string;
  sub?: string;
  needs_org_setup?: boolean;
  org_id?: string;
  avatar_url?: string;
  [key: string]: string | boolean | undefined;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: (skipReload?: boolean) => void;
  refresh: () => void;
  needsOrgSetup: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsOrgSetup, setNeedsOrgSetup] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  const fetchMe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setNeedsOrgSetup(!!data.needs_org_setup);
        setError(null);
        // console.info("[Auth] User loaded", data.user);
      } else {
        setUser(null);
        setNeedsOrgSetup(false);
        setError("Not authenticated");
        // console.info("[Auth] Not authenticated");
      }
    } catch (e) {
      setUser(null);
      setNeedsOrgSetup(false);
      setError("Auth error");
      // console.error("[Auth] Error fetching /me", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    // Revalidate auth/org state on tab focus
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchMe();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    // Revalidate on storage change (multi-tab logout/login)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "logout" || event.key === "login") {
        fetchMe();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const login = () => {
    window.location.href = `${API_BASE_URL}/api/v1/auth/github/login`;
  };

  const logout = async (skipReload = false) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setTimeout(fetchMe, 100);
      if (!skipReload) {
        window.location.href = "/"; // Force reload to clear SPA state
      }
    } catch (e) {
      // console.error("[Auth] Logout error", e);
    }
  };

  const refresh = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, refresh, needsOrgSetup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
