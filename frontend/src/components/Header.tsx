import { Github, Menu, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/monitors", label: "Monitors" },
  { to: "/org-settings", label: "Organization Settings" },
  { to: "/user-settings", label: "User Settings" },
  { to: "/billing", label: "Usage Details" },
];

export const Header = () => {
  const { user, loading, error, login, logout } = useAuth();
  const location = useLocation();
  const isPreLogin = location.pathname === "/";

  if (isPreLogin) {
    // Minimal header for pre-login/demo page
    return (
      <header className="bg-white/80 backdrop-blur shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Infrasync
          </span>
          <div className="flex items-center gap-3">
            <Link to="/demo">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Try Demo
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={login}>
              Sign up / Login with GitHub
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // Full header for post-login pages
  return (
    <header className="bg-white/80 backdrop-blur shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          to="/dashboard"
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          Infrasync
        </Link>
        <nav className="flex gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium px-3 py-2 rounded transition-colors duration-150 ${
                location.pathname.startsWith(link.to)
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-sm text-slate-500">Loading…</span>
          ) : error ? (
            <Button variant="outline" size="sm" onClick={login}>
              Login with GitHub
            </Button>
          ) : user ? (
            <>
              <div className="flex items-center gap-2 mr-2">
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt="GitHub avatar"
                    className="w-7 h-7 rounded-full border border-slate-200 shadow-sm"
                  />
                )}
                <a
                  href={
                    typeof user.username === "string" && user.username
                      ? `https://github.com/${user.username}`
                      : typeof user.email === "string" && user.email
                      ? `mailto:${user.email}`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-700 hover:underline hover:text-blue-700 transition-colors">
                  {user.username || user.email}
                </a>
              </div>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={login}>
              Login with GitHub
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};
