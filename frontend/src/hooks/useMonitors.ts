import { useEffect, useState } from "react";

export interface Monitor {
  id: string;
  repo: string;
  delivery_method: string;
  webhook_url: string;
  frequency: string;
  created_at: string;
  is_private: boolean;
  created_by?: string;
}

export function useMonitors() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  const fetchMonitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/monitor`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMonitors(data.monitors || []);
      } else {
        setError("Failed to load monitors");
        setMonitors([]);
      }
    } catch (e) {
      setError("Error loading monitors");
      setMonitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  return { monitors, loading, error, refetch: fetchMonitors };
}
