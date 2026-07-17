import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, ShieldCheck, ShieldX, UserRoundCheck } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ApprovalSettings {
  requireAdminApproval: boolean;
  updatedAt?: string;
}

interface ApprovalRequest {
  id: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  requestedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  userAgent?: string;
}

async function fetchApprovalSettings(): Promise<ApprovalSettings> {
  const res = await fetch("/api/admin/approval-settings", { credentials: "include" });
  if (res.status === 401) {
    window.location.href = "/admin/login";
    return { requireAdminApproval: false };
  }
  if (!res.ok) throw new Error("Failed to load approval settings");
  return res.json();
}

async function fetchApprovalRequests(): Promise<ApprovalRequest[]> {
  const res = await fetch("/api/admin/approval-requests", { credentials: "include" });
  if (res.status === 401) {
    window.location.href = "/admin/login";
    return [];
  }
  if (!res.ok) throw new Error("Failed to load approval requests");
  return res.json();
}

const statusClass: Record<ApprovalRequest["status"], string> = {
  pending: "border-amber-500/30 bg-amber-500/15 text-amber-200",
  approved: "border-green-500/30 bg-green-500/15 text-green-200",
  rejected: "border-red-500/30 bg-red-500/15 text-red-200",
};

export default function AdminApprovals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["admin", "approval-settings"],
    queryFn: fetchApprovalSettings,
  });

  const { data: requests = [], isLoading: isRequestsLoading, error } = useQuery({
    queryKey: ["admin", "approval-requests"],
    queryFn: fetchApprovalRequests,
  });

  const settingsMutation = useMutation({
    mutationFn: async (requireAdminApproval: boolean) => {
      const res = await fetch("/api/admin/approval-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireAdminApproval }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update approval settings");
      return data;
    },
    onSuccess: () => {
      toast({ title: "Settings updated", description: "Admin approval setting saved" });
      queryClient.invalidateQueries({ queryKey: ["admin", "approval-settings"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Settings update failed", description: err.message });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      const res = await fetch(`/api/admin/approval-requests/${id}/action`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${action} request`);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Request updated", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["admin", "approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Request update failed", description: err.message });
    },
  });

  const pendingCount = requests.filter(request => request.status === "pending").length;
  const approvedCount = requests.filter(request => request.status === "approved").length;
  const rejectedCount = requests.filter(request => request.status === "rejected").length;

  return (
    <AdminLayout
      title="Admin Approval"
      description="Review new signup requests before Jellyfin accounts are created."
    >
      <div className="space-y-4">
        <Card className="border-gray-800 bg-gray-950/60 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-blue-300" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-white">Require Admin Approval</div>
                <div className="mt-1 text-sm text-gray-400">
                  When enabled, new signups stay pending until approved here.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{settings?.requireAdminApproval ? "ON" : "OFF"}</span>
                <Switch
                  checked={Boolean(settings?.requireAdminApproval)}
                  disabled={isSettingsLoading || settingsMutation.isPending}
                  onCheckedChange={(checked) => settingsMutation.mutate(checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-amber-500/20 bg-amber-950/20 text-white">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-amber-300">Pending</div>
              <div className="mt-2 text-2xl font-bold text-amber-200">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-950/20 text-white">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-green-300">Approved</div>
              <div className="mt-2 text-2xl font-bold text-green-200">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-950/20 text-white">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-red-300">Rejected</div>
              <div className="mt-2 text-2xl font-bold text-red-200">{rejectedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-800 bg-gray-950/60 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundCheck className="h-5 w-5 text-blue-300" />
              Signup Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isRequestsLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading requests...
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-red-300">
                {error instanceof Error ? error.message : "Failed to load approval requests"}
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-8 text-center text-gray-500">
                No signup requests yet.
              </div>
            ) : (
              <>
              <div className="space-y-3 md:hidden">
                {requests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-gray-800 bg-gray-900/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-white">{request.username}</div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          <span>
                            {request.requestedAt || request.createdAt ? new Date(request.requestedAt || request.createdAt || "").toLocaleString() : "-"}
                          </span>
                        </div>
                      </div>
                      <Badge className={`shrink-0 border ${statusClass[request.status] || statusClass.pending}`}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        className="bg-green-700 hover:bg-green-800"
                        disabled={request.status !== "pending" || actionMutation.isPending}
                        onClick={() => actionMutation.mutate({ id: request.id, action: "approve" })}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={request.status !== "pending" || actionMutation.isPending}
                        onClick={() => actionMutation.mutate({ id: request.id, action: "reject" })}
                      >
                        <ShieldX className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-lg border border-gray-800 md:block">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="border-gray-800 bg-gray-900/80 hover:bg-gray-900/80">
                      <TableHead className="text-gray-400">Username</TableHead>
                      <TableHead className="text-gray-400">Requested</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-right text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id} className="border-gray-800 hover:bg-gray-900/60">
                        <TableCell className="font-medium text-white">{request.username}</TableCell>
                        <TableCell className="text-gray-400">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            {request.requestedAt || request.createdAt ? new Date(request.requestedAt || request.createdAt || "").toLocaleString() : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`border ${statusClass[request.status] || statusClass.pending}`}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-green-700 hover:bg-green-800"
                              disabled={request.status !== "pending" || actionMutation.isPending}
                              onClick={() => actionMutation.mutate({ id: request.id, action: "approve" })}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={request.status !== "pending" || actionMutation.isPending}
                              onClick={() => actionMutation.mutate({ id: request.id, action: "reject" })}
                            >
                              <ShieldX className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
