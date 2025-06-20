import { useEffect, useState } from "react";

export interface OrgMember {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

export function useOrgMembers() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/org/members`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      } else {
        setError("Failed to load members");
        setMembers([]);
      }
    } catch (e) {
      setError("Error loading members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return { members, loading, error, refetch: fetchMembers };
}
