"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { getUsers, softDeleteUser, type UserResponse } from "@/lib/api";

function useCurrentUserId(): number | null {
  const [me, setMe] = useState<number | null>(null);
  useEffect(() => {
    try {
      const authRaw = localStorage.getItem("auth");
      if (authRaw) {
        const auth = JSON.parse(authRaw);
        if (auth?.user?.id) {
          setMe(Number(auth.user.id));
          return;
        }
      }
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user?.id) {
          setMe(Number(user.id));
          return;
        }
      }
    } catch {}
    setMe(null);
  }, []);
  return me;
}

export default function Users() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const myId = useCurrentUserId();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // includeInactive=true to show all
        const data = await getUsers({ includeInactive: true, page: 1, limit: 500, sort: "id:asc" });
        const list = Array.isArray(data) ? data : (data as any)?.items ?? [];
        if (!mounted) return;
        setUsers(Array.isArray(list) ? list : []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load users.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const total = users.length;
  const activeCount = useMemo(
    () => users.filter((u) => Number(u.recSts) === 1).length,
    [users]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) => {
      const hay = `${u.id} ${u.email ?? ""} ${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [users, q]);

  const allSelectableIds = useMemo(() => filtered.map((u) => u.id), [filtered]);
  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selected.has(id));
  const isIndeterminate =
    selected.size > 0 && !allSelected && allSelectableIds.some((id) => selected.has(id));

  function toggleSelectAll(checked: boolean | "indeterminate") {
    setSelected((prev) => {
      const next = new Set<number>(prev);
      if (checked) {
        allSelectableIds.forEach((id) => next.add(id));
      } else {
        allSelectableIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }

  function toggleSelectOne(id: number, checked: boolean | "indeterminate") {
    setSelected((prev) => {
      const next = new Set<number>(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleConfirmDelete(id: number) {
    try {
      setDeletingId(id);
      await softDeleteUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, recSts: 0 } : u)));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (e: any) {
      alert(e?.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Total: {total}</Badge>
          <Badge>Active: {activeCount}</Badge>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, or ID…"
            className="pl-8 w-[260px]"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(v) => toggleSelectAll(v)}
            // @ts-ignore — shadcn supports indeterminate
            indeterminate={isIndeterminate}
          />
          Select all ({selected.size})
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-card p-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading users…
        </div>
      )}
      {!loading && err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {err}
        </div>
      )}

      {/* Table */}
      {!loading && !err && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]" />
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>First name</TableHead>
                <TableHead>Last name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const isMe = myId != null && Number(u.id) === Number(myId);
                const inactive = Number(u.recSts) === 0;
                const isChecked = selected.has(u.id);

                return (
                  <TableRow key={u.id} className={inactive ? "opacity-70" : ""}>
                    <TableCell>
                      <Checkbox checked={isChecked} onCheckedChange={(v) => toggleSelectOne(u.id, v)} />
                    </TableCell>
                    <TableCell className="font-medium">{u.id}</TableCell>
                    <TableCell>{u.firstName ?? "-"}</TableCell>
                    <TableCell>{u.lastName ?? "-"}</TableCell>
                    <TableCell className="truncate">{u.email}</TableCell>
                    <TableCell>
                      {inactive ? <Badge variant="secondary">Inactive</Badge> : <Badge>Active</Badge>}
                      {isMe && <Badge className="ml-2" variant="outline">You</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {isMe ? (
                        <span className="text-muted-foreground text-sm">You’re signed in</span>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={deletingId === u.id || inactive}>
                              {deletingId === u.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting…
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete user?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark the account as inactive (recSts = 0).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleConfirmDelete(u.id)}>
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No users match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
