import { Github, Menu, Play, LogOut } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  if (isPreLogin) {
    // Minimal header for pre-login/demo page
    return (
      <header className="bg-white/80 backdrop-blur shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo / Title */}
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent whitespace-nowrap">
            Infrasync
          </span>

          {/* Buttons (right-aligned, compact on mobile) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link to="/demo">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2.5 py-1.5">
                <Play className="w-4 h-4 mr-1" />
                Try Demo
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={login}
              className="text-xs sm:text-sm px-2.5 py-1.5">
              Login with GitHub
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
        {/* Mobile: Three columns, Desktop: current layout */}
        {isMobile ? (
          <>
            {/* Left: Logo/Title */}
            <div className="flex-1 flex justify-start">
              <Link
                to="/dashboard"
                className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent whitespace-nowrap">
                Infrasync
              </Link>
            </div>
            {/* Center: Dropdown */}
            <div className="flex-1 flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-0">
                    <Menu className="w-7 h-7 text-blue-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {navLinks.map((link) => (
                    <DropdownMenuItem asChild key={link.to}>
                      <Link
                        to={link.to}
                        className={
                          location.pathname.startsWith(link.to)
                            ? "bg-blue-100 text-blue-700"
                            : "text-slate-700 hover:bg-slate-100"
                        }>
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Right: User info */}
            <div className="flex-1 flex justify-end">
              {loading ? (
                <span className="text-sm text-slate-500">Loading…</span>
              ) : error ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={login}
                  className="w-full sm:w-auto">
                  Login with GitHub
                </Button>
              ) : user ? (
                <div className="flex items-center gap-2">
                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt="GitHub avatar"
                      className="w-7 h-7 rounded-full border border-slate-200 shadow-sm"
                    />
                  )}
                  <span className="text-sm font-medium text-slate-700">
                    {user.username || user.email}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => logout()}
                          className="ml-1 text-slate-500 hover:text-red-600"
                          aria-label="Logout">
                          <LogOut className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Logout</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/dashboard"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Infrasync
            </Link>
            <nav className="hidden sm:flex flex-1 justify-center gap-4 overflow-x-auto flex-nowrap max-w-full sm:flex-wrap">
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
              {loading ? (
                <span className="text-sm text-slate-500">Loading…</span>
              ) : error ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={login}
                  className="w-full sm:w-auto">
                  Login with GitHub
                </Button>
              ) : user ? (
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => logout()}
                          className="ml-1 text-slate-500 hover:text-red-600"
                          aria-label="Logout">
                          <LogOut className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Logout</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
