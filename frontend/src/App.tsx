import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/auth-callback";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import OrgSettingsPage from "./pages/OrgSettingsPage";
import Dashboard from "./pages/Dashboard";
import MonitorsPage from "./pages/MonitorsPage";
import UserSettings from "./pages/UserSettings";
import MonitorDetailPage from "./pages/MonitorDetailPage";
import CookiePolicy from "@/pages/CookiePolicy";

// Lazy load components for better performance
const LazyDashboard = lazy(() => import("./pages/Dashboard"));
const LazyMonitorsPage = lazy(() => import("./pages/MonitorsPage"));
const LazyMonitorDetailPage = lazy(() => import("./pages/MonitorDetailPage"));
const LazyOrgSettingsPage = lazy(() => import("./pages/OrgSettingsPage"));
const LazyUserSettings = lazy(() => import("./pages/UserSettings"));
const LazyBillingPage = lazy(() => import("./pages/BillingPage"));
const LazyOnboarding = lazy(() => import("@/components/Onboarding"));
const LazyTermsOfService = lazy(() => import("./pages/TermsOfService"));
const LazyPrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const LazyDemoPage = lazy(() => import("./pages/DemoPage"));

// Configure QueryClient with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes("HTTP 4")) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading, needsOrgSetup } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Defensive: treat user as null if missing required fields
  if (!user || !user.sub) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (needsOrgSetup) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, loading, needsOrgSetup } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If authenticated but needs onboarding, redirect to onboarding
  if (user && needsOrgSetup) {
    return <Navigate to="/onboarding" replace />;
  }

  if (user) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children;
}

// Error boundary fallback for specific routes
const RouteErrorFallback = ({ routeName }: { routeName: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Error loading {routeName}
      </h2>
      <p className="text-gray-600 mb-4">
        There was a problem loading this page. Please try refreshing.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Refresh Page
      </button>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <PublicRoute>
                      <Index />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <ErrorBoundary
                        fallback={<RouteErrorFallback routeName="Dashboard" />}>
                        <LazyDashboard />
                      </ErrorBoundary>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/monitors"
                  element={
                    <PrivateRoute>
                      <ErrorBoundary
                        fallback={<RouteErrorFallback routeName="Monitors" />}>
                        <LazyMonitorsPage />
                      </ErrorBoundary>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/monitors/:id"
                  element={
                    <PrivateRoute>
                      <ErrorBoundary
                        fallback={
                          <RouteErrorFallback routeName="Monitor Details" />
                        }>
                        <LazyMonitorDetailPage />
                      </ErrorBoundary>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/org-settings"
                  element={
                    <PrivateRoute>
                      <ErrorBoundary
                        fallback={
                          <RouteErrorFallback routeName="Organization Settings" />
                        }>
                        <LazyOrgSettingsPage />
                      </ErrorBoundary>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/user-settings"
                  element={
                    <PrivateRoute>
                      <ErrorBoundary
                        fallback={
                          <RouteErrorFallback routeName="User Settings" />
                        }>
                        <LazyUserSettings />
                      </ErrorBoundary>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <PrivateRoute>
                      <ErrorBoundary
                        fallback={<RouteErrorFallback routeName="Billing" />}>
                        <LazyBillingPage />
                      </ErrorBoundary>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <ErrorBoundary
                      fallback={<RouteErrorFallback routeName="Onboarding" />}>
                      <LazyOnboarding />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <ErrorBoundary
                      fallback={
                        <RouteErrorFallback routeName="Terms of Service" />
                      }>
                      <LazyTermsOfService />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <ErrorBoundary
                      fallback={
                        <RouteErrorFallback routeName="Privacy Policy" />
                      }>
                      <LazyPrivacyPolicy />
                    </ErrorBoundary>
                  }
                />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/demo" element={<LazyDemoPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
