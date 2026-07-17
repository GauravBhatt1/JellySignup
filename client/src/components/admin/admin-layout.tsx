import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  Activity,
  Archive,
  Clock,
  Film,
  HeartPulse,
  LogOut,
  ShieldCheck,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const navItems = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/admin/trials", label: "Trials", icon: Clock },
  { href: "/admin/recycle-bin", label: "Recycle Bin", icon: Archive },
  { href: "/admin/health", label: "Health", icon: HeartPulse },
  { href: "/admin/demand", label: "Demand", icon: Film },
];

interface AdminLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AdminLayout({ title, description, children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/logout");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      window.location.href = "/admin/login";
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
      });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0d14] to-[#121725] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-gray-800 bg-gray-950/70 px-4 py-5 lg:block">
          <div className="mb-6 flex items-center gap-2 px-2">
            <Activity className="h-6 w-6 text-primary" />
            <div>
              <div className="font-semibold leading-tight">JellySignup</div>
              <div className="text-xs text-gray-500">Admin Console</div>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href === "/admin/users" && location === "/admin/dashboard");
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "border border-blue-500/30 bg-blue-500/15 text-blue-200"
                        : "text-gray-400 hover:bg-gray-900 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-gray-800 bg-gray-900/60 px-4 py-4 sm:px-6">
            <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
                {description ? <p className="mt-1 text-sm text-gray-400">{description}</p> : null}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <nav className="grid grid-cols-3 gap-2 sm:flex lg:hidden">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href || (item.href === "/admin/users" && location === "/admin/dashboard");
                    return (
                      <Link key={item.href} href={item.href}>
                        <a
                          className={`flex h-10 items-center justify-center gap-1 rounded-xl border px-2 text-xs ${
                            isActive
                              ? "border-blue-500/40 bg-blue-500/20 text-blue-200"
                              : "border-gray-800 bg-gray-950/50 text-gray-400"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{item.label}</span>
                        </a>
                      </Link>
                    );
                  })}
                </nav>
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1800px] flex-1 p-3 sm:p-4 lg:p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
