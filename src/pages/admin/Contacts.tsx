// src/pages/admin/Contacts.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Search, Trash2, Eye, RefreshCcw } from "lucide-react";

import {
  listContacts,
  getContact,
  deleteContact as apiDeleteContact,
  type AdminContactRow,
  type ListContactsResponse,
} from "@/lib/api";

/* ============================================= */
/* types + helpers                               */
/* ============================================= */

type BudgetCode = "U2K" | "2-5K" | "5-10" | "10+";
type BudgetFilter = "" | BudgetCode;

/** نحاول نوحّد أي قيمة budget جاية من الباك */
function normalizeBudget(v?: string | null): BudgetCode | undefined {
  if (!v) return undefined;
  const s = String(v).toLowerCase().trim();
  if (s === "u2k" || s === "under-2k" || s === "under $2k" || s === "under 2k") return "U2K";
  if (s === "2-5k" || s === "2k-5k" || s === "$2k–$5k" || s === "$2k-$5k") return "2-5K";
  if (s === "5-10" || s === "5k-10k" || s === "$5k–$10k" || s === "$5k-$10k") return "5-10";
  if (s === "10+" || s === "10k-plus" || s === "$10k+" || s === "10k+") return "10+";
  // fallback لو الباك بيرسل قيمة مختلفة
  return undefined;
}

function BudgetBadge({ v }: { v?: string | null }) {
  const n = normalizeBudget(v);
  if (!n) return null;

  const label =
    n === "U2K" ? "Under $2k" : n === "2-5K" ? "$2k–$5k" : n === "5-10" ? "$5k–$10k" : "$10k+";

  const cls =
    n === "U2K"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : n === "2-5K"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : n === "5-10"
      ? "bg-violet-100 text-violet-700 border-violet-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <Badge
      variant="secondary"
      className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold border", cls)}
    >
      {label}
    </Badge>
  );
}

function toLocal(dt?: string) {
  if (!dt) return "";
  try {
    const d = new Date(dt);
    return d.toLocaleString();
  } catch {
    return dt;
  }
}

/** يجيب التاريخ من أي اسم حقل متاح */
const getCreated = (x: { createdAt?: string; creaDt?: string }) =>
  x?.createdAt ?? x?.creaDt ?? "";

/* ============================================= */
/* page                                          */
/* ============================================= */

export default function AdminContacts() {
  // list state
  const [rows, setRows] = useState<AdminContactRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [budget, setBudget] = useState<BudgetFilter>("");

  // pagination (offset/limit)
  const [limit, setLimit] = useState(12);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // drawer/detail
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminContactRow | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const fetchList = async (opts?: { resetOffset?: boolean }) => {
    setLoading(true);
    try {
      // داخل fetchList
const res: ListContactsResponse = await listContacts({
  q: q || undefined,
  ...(budget ? { budget } : {}),   // ⬅️ ابعت budget بس لو مش فاضي
  limit,
  offset: opts?.resetOffset ? 0 : offset,
});

      if (opts?.resetOffset) setOffset(0);
      setRows(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load messages");
    } finally {
      setLoading(false);
      setLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchList({ resetOffset: true });
  };

  const onOpenDetail = async (id: number) => {
    setOpenId(id);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const d = await getContact(id);
      setDetail(d);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load message");
      setOpenId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const deleteContact = async (id: number) => {
    const ok = window.confirm("Delete this message?");
    if (!ok) return;
    try {
      await apiDeleteContact(id);
      setRows((r) => r.filter((x) => x.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Message deleted");
      if (openId === id) {
        setOpenId(null);
        setDetail(null);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  const budgetLabel = useMemo(() => {
    if (!budget) return "All budgets";
    if (budget === "U2K") return "Under $2k";
    if (budget === "2-5K") return "$2k–$5k";
    if (budget === "5-10") return "$5k–$10k";
    return "$10k+";
  }, [budget]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Contacts</h1>
        </div>
        <Button variant="outline" onClick={() => fetchList()} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4 rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={onSearch} className="grid gap-3 md:grid-cols-[1fr_220px_120px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search name, email, phone…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-10 rounded-lg bg-slate-50 pl-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              <div>
                <Label className="sr-only">Budget</Label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value as BudgetFilter)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
                >
                  <option value="">All budgets</option>
                  <option value="U2K">Under $2k</option>
                  <option value="2-5K">$2k–$5k</option>
                  <option value="5-10">$5k–$10k</option>
                  <option value="10+">$10k+</option>
                </select>
              </div>
              <div className="hidden text-sm text-slate-500 md:flex items-center">
                {budgetLabel}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="h-10 w-full rounded-lg">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="p-0">
          {/* header */}
          <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-4 py-3 text-[12px] font-semibold text-slate-500">
            <div className="col-span-4">Contact</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-3">Budget</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* rows */}
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3">
                <div className="col-span-4 min-w-0">
                  <div className="truncate text-[14px] font-medium text-slate-800">
                    {r.fstname} {r.lstname}
                  </div>
                  <div className="truncate text-[12px] text-slate-500">{r.email}</div>
                </div>

                <div className="col-span-2 text-[13px] text-slate-700">{r.phone}</div>

                <div className="col-span-3 flex items-center gap-2">
                  <BudgetBadge v={r.budget as any} />
                  <div className="text-[12px] text-slate-500">
                    {r.webdesign && <span className="mr-2">Web</span>}
                    {r.wordpress && <span className="mr-2">WP</span>}
                    {r.seo && <span className="mr-2">SEO</span>}
                    {r.marketing && <span>Marketing</span>}
                  </div>
                </div>

                <div className="col-span-2 text-[12px] text-slate-500">
                  {toLocal(getCreated(r as any))}
                </div>

                <div className="col-span-1 flex items-center justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-600 hover:text-slate-800"
                    title="View"
                    aria-label="View"
                    onClick={() => onOpenDetail(r.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-600 hover:text-red-600"
                    title="Delete"
                    aria-label="Delete"
                    onClick={() => deleteContact(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {!loading && loadedOnce && rows.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No messages found.
              </div>
            )}

            {loading && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">Loading…</div>
            )}
          </div>

          {/* footer / pagination */}
          <Separator />
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <div className="text-slate-500">
              Page <span className="font-medium text-slate-700">{page}</span> of{" "}
              <span className="font-medium text-slate-700">{pages}</span> —{" "}
              <span className="font-medium text-slate-700">{total}</span> messages
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-md border border-slate-200 bg-white px-2"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                {[10, 12, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => setOffset((o) => o + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drawer / detail */}
      {openId != null && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpenId(null)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-[15px] font-semibold">Message details</h3>
              <Button variant="ghost" onClick={() => setOpenId(null)}>
                Close
              </Button>
            </div>

            <div className="p-4">
              {loadingDetail && <div className="text-sm text-slate-500">Loading…</div>}
              {!loadingDetail && detail && (
                <div className="space-y-3 text-[14px]">
                  <div className="font-semibold text-slate-800">
                    {detail.fstname} {detail.lstname}
                  </div>
                  <div className="text-slate-600">{detail.email}</div>
                  <div className="text-slate-700">{detail.phone}</div>
                  <div className="flex items-center gap-2">
                    <BudgetBadge v={detail.budget as any} />
                    <div className="text-[12px] text-slate-500">
                      {detail.webdesign && <span className="mr-2">Web</span>}
                      {detail.wordpress && <span className="mr-2">WP</span>}
                      {detail.seo && <span className="mr-2">SEO</span>}
                      {detail.marketing && <span>Marketing</span>}
                    </div>
                  </div>
                  <Separator />
                  <div className="whitespace-pre-wrap text-slate-800">
                    {detail.msg || "(no message)"}
                  </div>
                  <Separator />
                  <div className="text-[12px] text-slate-500">
                    Created: {toLocal(getCreated(detail as any))}
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => deleteContact(detail.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
