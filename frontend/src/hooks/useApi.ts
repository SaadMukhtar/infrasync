import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  showToast?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export function useApi<T = unknown>() {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(
    async (endpoint: string, options: ApiOptions = {}): Promise<T | null> => {
      const {
        method = "GET",
        body,
        headers = {},
        retries = 3,
        retryDelay = 1000,
        showToast = true,
      } = options;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
            credentials: "include",
            body: body ? JSON.stringify(body) : undefined,
          });

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;

            try {
              const errorData = await response.json();
              errorMessage =
                errorData.detail || errorData.message || errorMessage;
            } catch {
              // If we can't parse the error response, use the status text
              errorMessage = response.statusText || errorMessage;
            }

            // Handle specific error cases
            if (response.status === 401) {
              // Redirect to login or refresh token
              window.location.href = "/auth";
              return null;
            }

            if (response.status === 403) {
              errorMessage =
                "You do not have permission to perform this action";
            }

            if (response.status === 429) {
              errorMessage = "Too many requests. Please try again later.";
            }

            if (response.status >= 500) {
              errorMessage = "Server error. Please try again later.";
            }

            throw new Error(errorMessage);
          }

          const data = await response.json();

          setState({
            data,
            loading: false,
            error: null,
          });

          return data;
        } catch (error) {
          lastError = error as Error;

          // Don't retry on client errors (4xx)
          if (error instanceof Error && error.message.includes("HTTP 4")) {
            break;
          }

          // If this is the last attempt, don't wait
          if (attempt < retries) {
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay * attempt)
            );
          }
        }
      }

      // All retries failed
      const errorMessage = lastError?.message || "An unexpected error occurred";

      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      if (showToast) {
        toast?.({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }

      return null;
    },
    []
  );

  const get = useCallback(
    (endpoint: string, options?: Omit<ApiOptions, "method">) => {
      return request(endpoint, { ...options, method: "GET" });
    },
    [request]
  );

  const post = useCallback(
    (
      endpoint: string,
      body?: unknown,
      options?: Omit<ApiOptions, "method" | "body">
    ) => {
      return request(endpoint, { ...options, method: "POST", body });
    },
    [request]
  );

  const put = useCallback(
    (
      endpoint: string,
      body?: unknown,
      options?: Omit<ApiOptions, "method" | "body">
    ) => {
      return request(endpoint, { ...options, method: "PUT", body });
    },
    [request]
  );

  const patch = useCallback(
    (
      endpoint: string,
      body?: unknown,
      options?: Omit<ApiOptions, "method" | "body">
    ) => {
      return request(endpoint, { ...options, method: "PATCH", body });
    },
    [request]
  );

  const del = useCallback(
    (endpoint: string, options?: Omit<ApiOptions, "method">) => {
      return request(endpoint, { ...options, method: "DELETE" });
    },
    [request]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    reset,
  };
}

// Specialized hooks for common operations
export function useMonitorsApi() {
  const api = useApi();

  const fetchMonitors = useCallback(() => {
    return api.get("/api/v1/monitor");
  }, [api]);

  const createMonitor = useCallback(
    (data: unknown) => {
      return api.post("/api/v1/monitor", data);
    },
    [api]
  );

  const updateMonitor = useCallback(
    (id: string, data: unknown) => {
      return api.patch(`/api/v1/monitor/${id}`, data);
    },
    [api]
  );

  const deleteMonitor = useCallback(
    (id: string) => {
      return api.delete(`/api/v1/monitor/${id}`);
    },
    [api]
  );

  return {
    ...api,
    fetchMonitors,
    createMonitor,
    updateMonitor,
    deleteMonitor,
  };
}

export function useDigestApi() {
  const api = useApi();

  const createDigest = useCallback(
    (data: unknown) => {
      return api.post("/api/v1/digest", data);
    },
    [api]
  );

  const fetchMonitorDigests = useCallback(
    (monitorId: string, limit = 5) => {
      return api.get(`/api/v1/monitor/${monitorId}/digests?limit=${limit}`);
    },
    [api]
  );

  return {
    ...api,
    createDigest,
    fetchMonitorDigests,
  };
}

export function useOrgApi() {
  const api = useApi();

  const fetchOrgData = useCallback(() => {
    return api.get("/api/v1/org");
  }, [api]);

  const fetchOrgMetrics = useCallback(
    (periodDays = 7) => {
      return api.get(`/api/v1/org/metrics?period_days=${periodDays}`);
    },
    [api]
  );

  const fetchOrgMembers = useCallback(() => {
    return api.get("/api/v1/org/members");
  }, [api]);

  return {
    ...api,
    fetchOrgData,
    fetchOrgMetrics,
    fetchOrgMembers,
  };
}
