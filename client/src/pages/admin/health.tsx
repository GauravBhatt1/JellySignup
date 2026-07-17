import { useQuery } from "@tanstack/react-query";
import { Activity, Database, HeartPulse, Loader2, Server } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function fetchServerHealth() {
  const res = await fetch("/api/admin/server-health", { credentials: "include" });
  if (res.status === 401) {
    window.location.href = "/admin/login";
    return null;
  }
  if (!res.ok) throw new Error("Failed to load server health");
  return res.json();
}

export default function AdminHealth() {
  const { data: health, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "server-health"],
    queryFn: fetchServerHealth,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  const statusClass = health?.status === "healthy"
    ? "border-green-500/30 bg-green-500/15 text-green-300"
    : "border-amber-500/30 bg-amber-500/15 text-amber-300";

  return (
    <AdminLayout
      title="Server Health"
      description="Keep JellySignup, MongoDB, and Jellyfin connectivity in one quiet status page."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" className="border-gray-700 bg-gray-900" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <Card className="border-gray-800 bg-gray-950/60 text-white">
            <CardContent className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading health...
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-500/30 bg-red-950/20 text-white">
            <CardContent className="py-6 text-red-300">{error instanceof Error ? error.message : "Failed to load health"}</CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <Card className="border-gray-800 bg-gray-950/60 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
                    <HeartPulse className="h-4 w-4 text-green-400" /> Overall
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusClass}`}>
                    {health?.status || "unknown"}
                  </span>
                </CardContent>
              </Card>
              <Card className="border-gray-800 bg-gray-950/60 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
                    <Activity className="h-4 w-4 text-blue-400" /> Latency
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{health?.latencyMs ?? "—"}ms</CardContent>
              </Card>
              <Card className="border-gray-800 bg-gray-950/60 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
                    <Database className="h-4 w-4 text-purple-400" /> Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={health?.database?.ok ? "text-green-300" : "text-red-300"}>
                    {health?.database?.ok ? "Connected" : "Problem"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{health?.database?.type || "Unknown"}</div>
                </CardContent>
              </Card>
              <Card className="border-gray-800 bg-gray-950/60 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
                    <Server className="h-4 w-4 text-cyan-400" /> Jellyfin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={health?.jellyfin?.ok ? "text-green-300" : "text-red-300"}>
                    {health?.jellyfin?.ok ? "Reachable" : "Problem"}
                  </div>
                  {health?.jellyfin?.error ? <div className="mt-1 text-xs text-red-300">{health.jellyfin.error}</div> : null}
                </CardContent>
              </Card>
            </div>

            <Card className="border-gray-800 bg-gray-950/60 text-white">
              <CardHeader>
                <CardTitle className="text-base">Raw Status</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded-xl bg-black/40 p-4 text-xs text-gray-300">
                  {JSON.stringify(health, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
