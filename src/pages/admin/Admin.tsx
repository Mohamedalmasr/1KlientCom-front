// src/pages/admin/Admin.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Play, Square, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ===================== Types ===================== */
type Priority = "High" | "Medium" | "Low";
type TaskStatus = "todo" | "in_progress" | "done";
type Employee = { id: string; name: string; email: string };
type Task = {
  id: string;
  name: string;
  subject: string;
  priority: Priority;
  status: TaskStatus;
  estHours?: number;
  assignedTo?: string[]; // emails
};
type Project = {
  id: string;
  title: string;
  members: Employee[];
  tasks: Task[];
};

/* ===================== Hardcoded demo data ===================== */
const PEOPLE: Employee[] = [
  { id: "alex", name: "Alex Johnson", email: "alex.j@example.com" },
  { id: "maria", name: "Maria Garcia", email: "maria.g@example.com" }, // default viewer
  { id: "james", name: "James Smith", email: "james.s@example.com" },
  { id: "emily", name: "Emily Jones", email: "emily.j@example.com" },
];

const BASE_PROJECTS: Project[] = [
  {
    id: "p-ec",
    title: "E-commerce Platform",
    members: [PEOPLE[0], PEOPLE[1], PEOPLE[2]],
    tasks: [
      {
        id: "t-auth",
        name: "User Authentication Flow",
        subject: "Login, registration, password reset",
        priority: "High",
        estHours: 16,
        status: "todo",
        assignedTo: ["alex.j@example.com"],
      },
      {
        id: "t-api",
        name: "Products API",
        subject: "CRUD endpoints with pagination",
        priority: "High",
        estHours: 40,
        status: "in_progress",
        assignedTo: ["maria.g@example.com"],
      },
      {
        id: "t-ui",
        name: "Catalog UI",
        subject: "Listing, filters, and search",
        priority: "Medium",
        estHours: 12,
        status: "todo",
      },
    ],
  },
  {
    id: "p-mobile",
    title: "Mobile Banking App",
    members: [PEOPLE[1], PEOPLE[3]],
    tasks: [
      {
        id: "t-kyc",
        name: "KYC Screen",
        subject: "Capture documents & selfie flow",
        priority: "High",
        estHours: 24,
        status: "todo",
        assignedTo: ["maria.g@example.com"],
      },
      {
        id: "t-pay",
        name: "Payments SDK Integration",
        subject: "Card + Apple/Google Pay",
        priority: "Medium",
        estHours: 20,
        status: "done",
        assignedTo: ["emily.j@example.com"],
      },
    ],
  },
];

/* ===================== Viewer (for avatar + timer key only) ===================== */
function getCurrentUserFromStorage(): Employee | null {
  try {
    const uRaw = localStorage.getItem("authUser");
    if (uRaw) {
      const u = JSON.parse(uRaw);
      if (u?.email) {
        const name =
          [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
          String(u.email).split("@")[0];
        return { id: String(u.id ?? u.email), name, email: String(u.email) };
      }
    }
    const aRaw = localStorage.getItem("auth");
    if (aRaw) {
      const a = JSON.parse(aRaw);
      const u = a?.user;
      if (u?.email) {
        const name =
          [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
          String(u.email).split("@")[0];
        return { id: String(u.id ?? u.email), name, email: String(u.email) };
      }
    }
  } catch {}
  return null;
}
const DEFAULT_USER: Employee = PEOPLE[1];

/* ===================== Timer (persists only timers) ===================== */
const TIMER_PREFIX = "ok_time_"; // ok_time_<projectId>_<taskId>_<email>
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
};
const tKey = (projectId: string, taskId: string, email: string) =>
  `${TIMER_PREFIX}${projectId}_${taskId}_${email}`;

function TaskTimer({ projectId, taskId, email }: { projectId: string; taskId: string; email: string }) {
  const key = tKey(projectId, taskId, email);
  const [running, setRunning] = useState(false);
  const [total, setTotal] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const s = JSON.parse(raw);
        setRunning(!!s.running);
        setTotal(Number(s.totalMs || 0));
        setStartedAt(s.startedAt ?? null);
      }
    } catch {}
  }, [key]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = useMemo(
    () => (running && startedAt ? total + (Date.now() - startedAt) : total),
    [running, startedAt, total, tick]
  );

  function persist(next: { running: boolean; totalMs: number; startedAt: number | null }) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }
  function start() {
    if (running) return;
    const now = Date.now();
    setRunning(true);
    setStartedAt(now);
    persist({ running: true, totalMs: total, startedAt: now });
  }
  function stop() {
    if (!running || !startedAt) return;
    const now = Date.now();
    const sum = total + (now - startedAt);
    setRunning(false);
    setStartedAt(null);
    setTotal(sum);
    persist({ running: false, totalMs: sum, startedAt: null });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs text-slate-700">
        <Clock className={cn("h-3.5 w-3.5", running && "animate-pulse")} />
        <span className="tabular-nums">{fmt(elapsed)}</span>
      </div>
      {!running ? (
        <Button size="sm" className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700" onClick={start}>
          <Play className="mr-1 h-3.5 w-3.5" />
          IN
        </Button>
      ) : (
        <Button size="sm" variant="destructive" className="h-8 px-3" onClick={stop}>
          <Square className="mr-1 h-3.5 w-3.5" />
          OUT
        </Button>
      )}
    </div>
  );
}

/* ===================== UI helpers ===================== */
function PriorityBadge({ p }: { p: Priority }) {
  if (p === "High")
    return <Badge className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">High</Badge>;
  if (p === "Medium")
    return <Badge className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Medium</Badge>;
  return <Badge className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Low</Badge>;
}
function StatusBadge({ s }: { s: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    todo: "bg-slate-100 text-slate-700",
    in_progress: "bg-blue-100 text-blue-700",
    done: "bg-emerald-100 text-emerald-700",
  };
  const labels: Record<TaskStatus, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" };
  return <Badge className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", map[s])}>{labels[s]}</Badge>;
}
const AvatarCircle = ({ name }: { name: string }) => {
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Avatar className="h-8 w-8">
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

/* ===================== Task Row (full width) ===================== */
function TaskRow({ projectId, t, email }: { projectId: string; t: Task; email: string }) {
  return (
    <div className="flex w-full items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-slate-800">{t.name}</div>
        <div className="mt-1 text-[13.5px] text-slate-600">{t.subject}</div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          {typeof t.estHours === "number" && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {t.estHours} Est. hrs
            </span>
          )}
          <PriorityBadge p={t.priority} />
          <StatusBadge s={t.status} />
        </div>
      </div>
      <TaskTimer projectId={projectId} taskId={t.id} email={email} />
    </div>
  );
}

/* ===================== Page (flat list + filters) ===================== */
export default function Admin() {
  const viewer = useMemo(() => getCurrentUserFromStorage() ?? DEFAULT_USER, []);
  const [projects, setProjects] = useState<Project[]>(
    JSON.parse(JSON.stringify(BASE_PROJECTS)) as Project[]
  );
  const [projectId, setProjectId] = useState<string | null>(projects[0]?.id ?? null);

  // status filters (checkboxes beside Reset)
  const [filters, setFilters] = useState<{ todo: boolean; in_progress: boolean; done: boolean }>({
    todo: true,
    in_progress: true,
    done: true,
  });

  useEffect(() => {
    if (!projects.find((p) => p.id === projectId)) {
      setProjectId(projects[0]?.id ?? null);
    }
  }, [projects, projectId]);

  const current = useMemo(() => projects.find((p) => p.id === projectId) || null, [projects, projectId]);

  function resetView() {
    setProjects(JSON.parse(JSON.stringify(BASE_PROJECTS)) as Project[]);
    setFilters({ todo: true, in_progress: true, done: true });
  }

  const filteredTasks = useMemo(() => {
    if (!current) return [];
    return current.tasks.filter((t) => filters[t.status]);
  }, [current, filters]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>

        {/* Filters + Reset */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 rounded-xl border bg-white px-3 py-2 text-xs">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filters.todo}
                onCheckedChange={(v) => setFilters((f) => ({ ...f, todo: v === true }))}
              />
              <span>To Do</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filters.in_progress}
                onCheckedChange={(v) => setFilters((f) => ({ ...f, in_progress: v === true }))}
              />
              <span>In Progress</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={filters.done}
                onCheckedChange={(v) => setFilters((f) => ({ ...f, done: v === true }))}
              />
              <span>Done</span>
            </label>
          </div>

          <Button variant="outline" className="gap-2" onClick={resetView}>
            <RefreshCw className="h-4 w-4" />
            Reset view
          </Button>
        </div>
      </div>

      {/* viewer + project picker */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Signed in as</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 pt-0">
            <AvatarCircle name={viewer.name} />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-slate-800">{viewer.name}</div>
              <div className="truncate text-[13px] text-slate-500">{viewer.email}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Project</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select value={projectId ?? undefined} onValueChange={(v) => setProjectId(v)}>
              <SelectTrigger className="h-10 w-full rounded-lg bg-slate-50">
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent className="w-[--radix-select-trigger-width]">
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* flat, full-width task list (with filters) */}
      {current && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{current.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {filteredTasks.map((t) => (
              <TaskRow key={t.id} projectId={current.id} t={t} email={viewer.email.toLowerCase()} />
            ))}
            {filteredTasks.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
                No tasks match the selected filters.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
