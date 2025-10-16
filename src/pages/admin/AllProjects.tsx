// src/pages/admin/AllProjects.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Pencil, ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { listProjects, type ProjectCard, deleteProject } from "@/lib/api";
import { toast } from "sonner";

/* ===== UI: confirm dialog (A1: add-only) ===== */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
/* ============================================ */

/* ================= types ================= */
type Project = {
  id: number;
  title: string;
  summary: string;
  status: "offtrack" | "on-track" | "completed";
  due: string; // ISO date
  issues: number;
  members: { name: string; avatar?: string }[];
  href?: string;
  canEdit?: boolean;
};

/* ================= helpers ================= */
function formatDate(d: string) {
  const date = new Date(d);
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

function StatusBadge({ s }: { s: Project["status"] }) {
  const map: Record<Project["status"], { label: string; cls: string }> = {
    offtrack: {
      label: "Offtrack",
      cls: "bg-red-100 text-red-700 border border-red-200",
    },
    "on-track": {
      label: "On Track",
      cls: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    },
    completed: {
      label: "Completed",
      cls: "bg-blue-100 text-blue-700 border-blue-200",
    },
  };
  const m = map[s];
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5",
        m.cls
      )}
    >
      {m.label}
    </Badge>
  );
}

function Members({ members }: { members: Project["members"] }) {
  return (
    <div className="flex -space-x-2">
      {members.slice(0, 4).map((m, i) => (
        <Avatar
          key={`${m.name}-${i}`}
          className="h-6 w-6 ring-2 ring-white shadow-sm"
          title={m.name}
        >
          {m.avatar ? (
            <AvatarImage src={m.avatar} alt={m.name} />
          ) : (
            <AvatarFallback className="text-[11px]">{m.name}</AvatarFallback>
          )}
        </Avatar>
      ))}
      {members.length > 4 && (
        <div className="ml-2 text-xs text-slate-500">+{members.length - 4}</div>
      )}
    </div>
  );
}

function normalizeStatus(s?: string): Project["status"] {
  const v = (s ?? "").toLowerCase();
  if (v.includes("complete")) return "completed";
  if (v.includes("off")) return "offtrack";
  return "on-track";
}

function initialsFromNameOrEmail(s: string): string {
  const name = (s || "").trim();
  if (!name) return "??";
  const base = name.includes("@") ? name.split("@")[0] : name;
  const parts = base.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function toProject(p: ProjectCard): Project {
  return {
    id: Number(p.projectAID),
    title: p.title ?? "",
    summary: p.description ?? "",
    status: normalizeStatus(p.status),
    due: p.dueDate ?? new Date().toISOString(),
    issues: Number(p.issuesCount ?? 0),
    members: Array.isArray(p.team)
      ? p.team.map((n) => ({ name: initialsFromNameOrEmail(String(n)) }))
      : [],
    canEdit: true,
  };
}

/* ================= page ================= */
export default function AllProjects() {
  const [data, setData] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  /* === delete dialog state (A1) === */
  const [openDelete, setOpenDelete] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    let cancel = false;

    async function loadAll() {
      try {
        const pageSize = 100;
        let offset = 0;
        const acc: Project[] = [];

        // اجمع كل المشاريع على صفحات لحد ما تخلص
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const res = await listProjects({ limit: pageSize, offset });
          const chunk = (res.items ?? []).map(toProject);
          acc.push(...chunk);
          if (chunk.length < pageSize) break;
          offset += pageSize;
        }

        if (!cancel) setData(acc);
      } catch {
        if (!cancel) setData([]);
      } finally {
        if (!cancel) setLoaded(true);
      }
    }

    loadAll();
    return () => {
      cancel = true;
    };
  }, []);

  /* ====== delete handlers (A1) ====== */
  function askDelete(id: number) {
    setPendingId(id);
    setOpenDelete(true);
  }

  async function confirmDelete() {
    if (!pendingId) return;
    const id = pendingId;
    setOpenDelete(false);
    setPendingId(null);

    await toast.promise(
      deleteProject(id),
      {
        loading: "Deleting project…",
        success: () => {
          setData((cur) => cur.filter((p) => p.id !== id));
          return "Project deleted successfully";
        },
        error: (e) => (e?.message as string) || "Failed to delete project",
      }
    );
  }
  /* ================================== */

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Projects
        </h1>
        <p className="text-sm text-slate-500">
          Overview of active initiatives and delivery status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.map((p) => (
          <Card
            key={p.id}
            className="rounded-2xl border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <CardContent className="p-4">
              {/* Title row */}
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-[17px] font-semibold text-slate-800">
                    {p.title}
                  </h3>
                  {p.canEdit && (
                    <span
                      role="button"
                      title="Edit"
                      className="inline-flex cursor-pointer items-center rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => navigate(`/admin/projects/${p.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </span>
                  )}
                  {/* Delete */}
                  {p.canEdit && (
                    <span
                      role="button"
                      title="Delete"
                      className="inline-flex cursor-pointer items-center rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      onClick={() => askDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  )}
                </div>

                <StatusBadge s={p.status} />
              </div>

              {/* Summary */}
              <p className="mb-4 line-clamp-3 text-[13.5px] leading-5 text-slate-600">
                {p.summary}
              </p>

              {/* Footer row */}
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-2">
                  {/* Date */}
                  <div className="flex items-center gap-2 text-[13px] font-semibold">
                    <CalendarDays
                      className={cn(
                        "h-4 w-4",
                        p.status === "offtrack" && "text-red-600",
                        p.status === "on-track" && "text-emerald-600",
                        p.status === "completed" && "text-blue-600"
                      )}
                    />
                    <span
                      className={cn(
                        "tracking-wide",
                        p.status === "offtrack" && "text-red-600",
                        p.status === "on-track" && "text-emerald-600",
                        p.status === "completed" && "text-blue-600"
                      )}
                    >
                      {formatDate(p.due)}
                    </span>
                  </div>

                  {/* Members */}
                  <Members members={p.members} />
                </div>

                {/* Issues */}
                <div className="text-right text-[12.5px] leading-5 text-slate-500">
                  <div className="text-slate-800">{p.issues}</div>
                  <div>Issues</div>
                </div>
              </div>

              {/* Optional open link */}
              {p.href && (
                <a
                  href={p.href}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No pagination UI */}
      {!loaded && <div className="sr-only">Loading…</div>}

      {/* ===== Delete confirm dialog (A1) ===== */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              Delete project?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This action cannot be undone. The project and its task
              assignments will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-lg bg-[#1f4ed8] text-white hover:bg-[#1e3ed8]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* ===================================== */}
    </div>
  );
}
