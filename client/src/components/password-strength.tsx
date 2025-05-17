import { useMemo } from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { strength, label, color, bgColor, icon: Icon, message } = useMemo(() => {
    if (!password) {
      return { 
        strength: 0, 
        label: "No password", 
        color: "text-gray-400", 
        bgColor: "bg-gray-700",
        icon: Shield,
        message: "Please enter a password"
      };
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
    let bgColor: string;
    let icon: any;
    let message: string;
    
    if (percentage < 30) {
      label = "Weak";
      color = "text-red-400";
      bgColor = "bg-red-500";
      icon = ShieldAlert;
      message = "Add more characters and mix of numbers and symbols";
    } else if (percentage < 70) {
      label = "Medium";
      color = "text-yellow-400";
      bgColor = "bg-yellow-400";
      icon = Shield;
      message = "Good but could be stronger with special characters";
    } else {
      label = "Strong";
      color = "text-green-400";
      bgColor = "bg-green-500";
      icon = ShieldCheck;
      message = "Great password! Strong and secure";
    }
    
    return { strength: percentage, label, color, bgColor, icon, message };
  }, [password]);

  return (
    <div className="mb-6 bg-gray-900/40 p-4 rounded-lg border border-gray-800">
      <div className="flex items-start space-x-3 mb-3">
        <Icon className={`h-5 w-5 mt-0.5 ${color}`} />
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-200">Password strength</span>
            <span className={`text-sm font-medium ${color}`}>
              {label}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{message}</p>
        </div>
      </div>
      
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${bgColor} rounded-full transition-all duration-300`} 
          style={{ width: `${strength}%` }}
        />
      </div>
    </div>
  );
}
