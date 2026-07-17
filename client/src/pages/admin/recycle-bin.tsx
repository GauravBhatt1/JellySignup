import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Loader2, RotateCcw, Trash } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

async function fetchRecycleBin() {
  const res = await fetch("/api/admin/recycle-bin/users", { credentials: "include" });
  if (res.status === 401) {
    window.location.href = "/admin/login";
    return [];
  }
  if (!res.ok) throw new Error("Failed to load recycle bin");
  return res.json();
}

export default function AdminRecycleBin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin", "recycle-bin-users"],
    queryFn: fetchRecycleBin,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: async ({ recycleId, action }: { recycleId: string; action: "restore" | "remove" }) => {
      const res = await fetch(
        action === "restore" ? `/api/admin/recycle-bin/users/${recycleId}/restore` : `/api/admin/recycle-bin/users/${recycleId}`,
        {
          method: action === "restore" ? "POST" : "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: action === "restore" ? "{}" : undefined,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Recycle bin action failed");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["admin", "recycle-bin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Recycle Bin Action Failed", description: err.message });
    }
  });

  return (
    <AdminLayout
      title="User Recycle Bin"
      description="Recover deleted Jellyfin users or permanently free reserved usernames."
    >
      <Card className="border-gray-800 bg-gray-950/60 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-amber-300" />
            Deleted Users ({users.length})
          </CardTitle>
          <p className="text-sm text-gray-400">
            Usernames in this bin are reserved. Restore will be blocked if the username already exists in Jellyfin.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading recycle bin...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-300">
              {error instanceof Error ? error.message : "Failed to load recycle bin"}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-8 text-center text-gray-500">
              Recycle bin is empty.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {users.map((item: any) => (
                <div key={item.recycleId} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-white">{item.name}</div>
                      <div className="mt-1 text-xs text-gray-500">Deleted {new Date(item.deletedAt).toLocaleString()}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.policy?.IsDisabled ? <span className="rounded-full border border-red-500/30 bg-red-500/15 px-2 py-1 text-xs text-red-300">Disabled</span> : <span className="rounded-full border border-green-500/30 bg-green-500/15 px-2 py-1 text-xs text-green-300">Active</span>}
                        {item.policy?.EnableContentDownloading ? <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-1 text-xs text-blue-300">Downloads On</span> : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 border-gray-700 bg-gray-800"
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate({ recycleId: item.recycleId, action: "restore" })}
                        title="Restore user"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="destructive" className="h-9 w-9" disabled={mutation.isPending} title="Permanently delete entry">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-gray-800 bg-gray-900 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently delete recycle entry?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              This frees the username "{item.name}" and removes the restore backup from JellySignup.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => mutation.mutate({ recycleId: item.recycleId, action: "remove" })}>
                              Permanently Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
