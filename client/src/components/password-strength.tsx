import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { strength, label, color } = useMemo(() => {
    if (!password) {
      return { strength: 0, label: "No password", color: "bg-gray-700" };
    }

    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character type checks
    if (/\d/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    const percentage = Math.min(Math.floor((score / 5) * 100), 100);
    
    // Determine label and color based on score
    let label: string;
    let color: string;
    
    if (percentage < 30) {
      label = "Weak";
      color = "bg-red-500";
    } else if (percentage < 70) {
      label = "Medium";
      color = "bg-yellow-400";
    } else {
      label = "Strong";
      color = "bg-green-500";
    }
    
    return { strength: percentage, label, color };
  }, [password]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">Password strength</span>
        <span className={`text-xs ${
          color === "bg-red-500" ? "text-red-400" : 
          color === "bg-yellow-400" ? "text-yellow-400" : 
          "text-green-400"
        }`}>
          {label}
        </span>
      </div>
      <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-300`} 
          style={{ width: `${strength}%` }}
        />
      </div>
    </div>
  );
}
