import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Github, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RepoInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const RepoInput = ({ value, onChange, disabled }: RepoInputProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    "valid" | "invalid" | "private" | null
  >(null);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  const validateRepo = async () => {
    if (!value) return;
    setIsValidating(true);
    const parts = value.split("/");
    const isFormattedCorrectly = parts.length === 2;
    if (!isFormattedCorrectly) {
      setValidationStatus("invalid");
      setValidationMsg("Invalid format. Use owner/repo.");
      setIsValidating(false);
      return;
    }
    const [owner, repo] = parts;
    try {
      if (user) {
        // Logged in: validate via backend (supports private repos)
        const res = await fetch(
          `${API_BASE_URL}/api/v1/github/validate-repo?repo=${owner}/${repo}`,
          { credentials: "include" }
        );
        if (res.ok) {
          setValidationStatus("valid");
          setValidationMsg("Repository found");
        } else if (res.status === 404) {
          setValidationStatus("invalid");
          setValidationMsg("Repository not found or you do not have access.");
        } else if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          setValidationStatus("private");
          setValidationMsg(
            data.detail || "Not authorized to access this repository."
          );
        } else {
          setValidationStatus("invalid");
          setValidationMsg("Validation failed. Try again.");
        }
      } else {
        // Not logged in: public GitHub API only
        const url = `https://api.github.com/repos/${owner}/${repo}`;
        const response = await fetch(url);
        if (response.status === 200) {
          setValidationStatus("valid");
          setValidationMsg("Repository found");
        } else if (response.status === 404) {
          setValidationStatus("private");
          setValidationMsg(
            "Repository not found. If this is a private repository, please log in to validate."
          );
        } else if (response.status === 403) {
          setValidationStatus("private");
          setValidationMsg(
            "Not authorized. Please relogin and reattempt if this is a private repository."
          );
        } else {
          setValidationStatus("invalid");
          setValidationMsg("Validation failed. Try again.");
        }
      }
    } catch (error) {
      setValidationStatus("invalid");
      setValidationMsg("Validation failed. Try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setValidationStatus(null);
    setValidationMsg(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="repo"
          className="text-sm font-medium text-slate-700 flex items-center gap-2">
          GitHub Repository
          <span className="relative group">
            <Info
              className="w-4 h-4 text-slate-400 cursor-pointer"
              aria-label="Info about private repos"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
              Private repositories can only be validated after logging in.
            </span>
          </span>
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="repo"
              placeholder="owner/repository-name"
              value={value}
              onChange={handleInputChange}
              className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              aria-describedby="repo-help"
              disabled={disabled}
            />
          </div>
          <Button
            onClick={validateRepo}
            disabled={disabled || !value || isValidating || authLoading}
            variant="outline"
            className="px-4">
            {isValidating ? "Checking..." : "Validate"}
          </Button>
        </div>
      </div>

      {!isValidating && validationStatus && (
        <div className="flex items-center gap-2" id="repo-help">
          {validationStatus === "valid" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700">
                {validationMsg || "Repository found"}
              </Badge>
            </>
          ) : validationStatus === "private" ? (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-700">
                {validationMsg ||
                  "Repository not found. If this is a private repository, please log in to validate."}
              </Badge>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-600" />
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {validationMsg || "Repository not found"}
              </Badge>
            </>
          )}
        </div>
      )}

      <div className="text-xs text-slate-500">
        <p>Examples: facebook/react, microsoft/vscode, vercel/next.js</p>
      </div>
    </div>
  );
};
