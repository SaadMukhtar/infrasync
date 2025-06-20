
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Github, CheckCircle2, AlertCircle } from "lucide-react";

interface RepoInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const RepoInput = ({ value, onChange }: RepoInputProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<"valid" | "invalid" | null>(null);

  const validateRepo = async () => {
    if (!value) return;
    
    setIsValidating(true);
    
    // Mock validation - in real app, this would hit GitHub API
    setTimeout(() => {
      const isValid = value.includes("/") && value.split("/").length === 2;
      setValidationStatus(isValid ? "valid" : "invalid");
      setIsValidating(false);
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setValidationStatus(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="repo" className="text-sm font-medium text-slate-700">
          GitHub Repository
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
            />
          </div>
          <Button 
            onClick={validateRepo}
            disabled={!value || isValidating}
            variant="outline"
            className="px-4"
          >
            {isValidating ? "Checking..." : "Validate"}
          </Button>
        </div>
      </div>

      {validationStatus && (
        <div className="flex items-center gap-2">
          {validationStatus === "valid" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Repository found
              </Badge>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-600" />
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                Repository not found
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
