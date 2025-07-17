import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refresh, user, loading, needsOrgSetup } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      // Log for debugging
      console.info("[AuthCallback] Received JWT token", token);
      // Instead of storing in localStorage, call backend to set httpOnly cookie
      fetch(`${API_BASE_URL}/api/v1/auth/set-cookie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) {
            console.info("[AuthCallback] JWT cookie set successfully");
          } else {
            console.error("[AuthCallback] Failed to set JWT cookie");
          }
        })
        .catch((e) => {
          console.error("[AuthCallback] Error setting JWT cookie", e);
        })
        .finally(() => {
          // Refresh auth state before navigating
          refresh();
        });
    } else {
      console.error("[AuthCallback] No token found in query params");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    }
    // Only run on mount
    // eslint-disable-next-line
  }, [API_BASE_URL]);

  useEffect(() => {
    // Wait for auth state to hydrate
    if (loading) return;
    if (user && (needsOrgSetup || !user.org_id)) {
      navigate("/onboarding", { replace: true });
    } else if (user) {
      navigate("/dashboard", { replace: true });
    } else if (!loading && !user) {
      navigate("/", { replace: true });
    }
  }, [user, needsOrgSetup, loading, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Logging you in…</h1>
      <p className="text-slate-600">
        Please wait while we complete your login.
      </p>
    </div>
  );
};

export default AuthCallback;
