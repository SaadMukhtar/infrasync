import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY = 400;

const AuthCallback = () => {
  const navigate = useNavigate();
  const attempts = useRef(0);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const tryAuth = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/me`,
        {
          credentials: "include",
        }
      );
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setLoading(false);
        if (data.user && (data.needs_org_setup || !data.user.org_id)) {
          navigate("/onboarding", { replace: true });
        } else if (data.user) {
          navigate("/dashboard", { replace: true });
        } else {
          setFailed(true);
        }
      } else if (attempts.current < MAX_ATTEMPTS) {
        attempts.current += 1;
        setTimeout(tryAuth, RETRY_DELAY);
      } else {
        setLoading(false);
        setFailed(true);
      }
    };
    tryAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (failed) {
      navigate("/", { replace: true });
    }
  }, [failed, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Logging you in…</h1>
      {loading && (
        <svg
          className="animate-spin h-8 w-8 text-blue-600 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      )}
      <p className="text-slate-600">
        {loading
          ? "Please wait while we complete your login."
          : failed
          ? "Login failed. Redirecting to home…"
          : null}
      </p>
    </div>
  );
};

export default AuthCallback;
