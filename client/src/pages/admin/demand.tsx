import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, FileDown, Film, Loader2, Plus, RotateCcw, Search, ShieldX, Trash } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface DemandEntry {
  id: string;
  query: string;
  mediaType: string;
  resultCount: number;
  status: "pending" | "added" | "rejected" | "ignored";
  users: string[];
  firstSearchedAt: string;
  lastSearchedAt: string;
}

async function fetchDemandEntries(): Promise<DemandEntry[]> {
  const res = await fetch("/api/admin/demand", { credentials: "include" });
  if (res.status === 401) {
    window.location.href = "/admin/login";
    return [];
  }
  if (!res.ok) throw new Error("Failed to load demand analytics");
  return res.json();
}

const statusClasses: Record<DemandEntry["status"], string> = {
  pending: "border-amber-500/30 bg-amber-500/15 text-amber-200",
  added: "border-green-500/30 bg-green-500/15 text-green-200",
  rejected: "border-red-500/30 bg-red-500/15 text-red-200",
  ignored: "border-gray-500/30 bg-gray-500/15 text-gray-300",
};

export default function DemandAnalytics() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState("manual-admin");
  const [filter, setFilter] = useState("");

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ["admin", "demand"],
    queryFn: fetchDemandEntries,
    refetchOnWindowFocus: false,
  });

  const recordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/demand", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          username: username || "manual-admin",
          mediaType: "unknown",
          resultCount: 0,
          source: "manual-admin"
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record demand");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Demand recorded", description: data.message });
      setQuery("");
      queryClient.invalidateQueries({ queryKey: ["admin", "demand"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Failed to record demand", description: err.message });
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DemandEntry["status"] }) => {
      const res = await fetch(`/api/admin/demand/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update demand");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Demand updated", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["admin", "demand"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Failed to update demand", description: err.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/demand/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete demand");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Demand removed", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["admin", "demand"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Failed to remove demand", description: err.message });
    }
  });

  const filteredEntries = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter(entry =>
      entry.query.toLowerCase().includes(needle) ||
      entry.status.includes(needle) ||
      entry.users.some(user => user.toLowerCase().includes(needle))
    );
  }, [entries, filter]);

  const pendingCount = entries.filter(entry => entry.status === "pending").length;
  const addedCount = entries.filter(entry => entry.status === "added").length;
  const uniqueUsers = new Set(entries.flatMap(entry => entry.users || [])).size;

  const exportCsv = () => {
    const headers = ["query", "status", "users", "lastSearchedAt"];
    const csv = [
      headers.join(","),
      ...filteredEntries.map(entry => [
        entry.query,
        entry.status,
        (entry.users || []).join(" | "),
        entry.lastSearchedAt
      ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jellysignup-demand-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout
      title="Demand Analytics"
      description="Track missing movie/show demand and keep the request queue away from user management."
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-950/60 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Demand Items</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{entries.length}</CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-950/20 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-300">Pending</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold text-amber-200">{pendingCount}</CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-950/20 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-green-300">Added</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold text-green-200">{addedCount}</CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-950/20 text-white">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-300">Users</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold text-blue-200">{uniqueUsers}</CardContent>
          </Card>
        </div>

        <Card className="border-gray-800 bg-gray-950/60 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-blue-300" />
              Manual Missing Demand
            </CardTitle>
            <p className="text-sm text-gray-400">
              This lets you test the working queue now. Later the Jellyfin capture layer will write here automatically.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Movie or show title users searched for..."
                className="border-gray-700 bg-gray-900 text-white"
              />
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="username"
                className="border-gray-700 bg-gray-900 text-white"
              />
              <Button
                onClick={() => recordMutation.mutate()}
                disabled={recordMutation.isPending || query.trim().length < 2}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {recordMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add Demand
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-950/60 text-white">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-300" />
                  Missing Search Queue
                </CardTitle>
                <p className="mt-1 text-sm text-gray-400">Missing titles are merged into one demand item per title.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder="Filter demand..."
                    className="w-full border-gray-700 bg-gray-900 pl-9 text-white sm:w-64"
                  />
                </div>
                <Button variant="outline" className="border-gray-700 bg-gray-800" onClick={exportCsv} disabled={filteredEntries.length === 0}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading demand...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-300">
                {error instanceof Error ? error.message : "Failed to load demand analytics"}
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-8 text-center text-gray-500">
                No demand entries yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-800">
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow className="border-gray-800 bg-gray-900/80 hover:bg-gray-900/80">
                      <TableHead className="text-gray-400">Title / Query</TableHead>
                      <TableHead className="text-gray-400">Users</TableHead>
                      <TableHead className="text-gray-400">Last Search</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-right text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id} className="border-gray-800 hover:bg-gray-900/60">
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2">
                            <Film className="h-4 w-4 text-cyan-300" />
                            {entry.query}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">{entry.mediaType || "unknown"} • result count {entry.resultCount ?? 0}</div>
                        </TableCell>
                        <TableCell className="text-gray-300">{(entry.users || []).slice(0, 3).join(", ")}{entry.users?.length > 3 ? ` +${entry.users.length - 3}` : ""}</TableCell>
                        <TableCell className="text-gray-400">{entry.lastSearchedAt ? new Date(entry.lastSearchedAt).toLocaleString() : "—"}</TableCell>
                        <TableCell>
                          <Badge className={`border ${statusClasses[entry.status] || statusClasses.pending}`}>{entry.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8 border-green-700/50 bg-green-900/20" title="Mark added" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: entry.id, status: "added" })}>
                              <CheckCircle2 className="h-4 w-4 text-green-300" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 border-amber-700/50 bg-amber-900/20" title="Mark pending" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: entry.id, status: "pending" })}>
                              <RotateCcw className="h-4 w-4 text-amber-300" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 border-red-700/50 bg-red-900/20" title="Reject" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: entry.id, status: "rejected" })}>
                              <ShieldX className="h-4 w-4 text-red-300" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-8 w-8" title="Delete entry" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(entry.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
