// src/pages/admin/Admin.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Play,
  Square,
  RefreshCw,
  X,
  ToggleLeft,
  Check,
} from "lucide-react";
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

type TableFilters = {
  searchTask: string;
  searchSubject: string;
  priority: "" | Priority;
  status: "" | TaskStatus;
  assignee: "" | "unassigned" | string; // email
};

/* ===================== Demo data ===================== */
const PEOPLE: Employee[] = [
  { id: "alex", name: "Alex Johnson", email: "alex.j@example.com" },
  { id: "maria", name: "Maria Garcia", email: "maria.g@example.com" },
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

/* ===================== Viewer ===================== */
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

/* ===================== Timer helpers ===================== */
const TIMER_PREFIX = "ok_time_";
const NOTE_SUFFIX = "_last_note";
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
};
const to1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const tKey = (projectId: string, taskId: string, email: string) =>
  `${TIMER_PREFIX}${projectId}_${taskId}_${email}`;

/* ===================== TaskTimer ===================== */
/** يوفّر onRequestStop للبارنت علشان يطلب نوت قبل الإيقاف. */
function TaskTimer({
  projectId,
  taskId,
  email,
  estHours,
  onRequestStop,
  onStopped,
}: {
  projectId: string;
  taskId: string;
  email: string;
  estHours?: number;
  onRequestStop?: (proceed: () => void) => void; // يستدعيه قبل الإيقاف لإجبار كتابة النوت
  onStopped?: (totalMs: number) => void; // كولباك اختياري بعد الإيقاف
}) {
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
  const elapsedHours = elapsed / 3600000;

  function persist(next: {
    running: boolean;
    totalMs: number;
    startedAt: number | null;
  }) {
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

  // الإيقاف الحقيقي
  const doStop = () => {
    if (!running || !startedAt) return;
    const now = Date.now();
    const sum = total + (now - startedAt);
    setRunning(false);
    setStartedAt(null);
    setTotal(sum);
    persist({ running: false, totalMs: sum, startedAt: null });
    onStopped?.(sum);
  };

  // الإيقاف المحمي: لو فيه onRequestStop يطلب نوت قبل doStop
  function stopGuarded() {
    if (onRequestStop) {
      onRequestStop(doStop);
      return;
    }
    doStop();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs text-slate-700">
        <Clock className={cn("h-3.5 w-3.5", running && "animate-pulse")} />
        <span className="tabular-nums">{fmt(elapsed)}</span>
      </div>
      {typeof estHours === "number" && (
        <div className="text-xs text-slate-600 tabular-nums">
          {to1(elapsedHours)} / {estHours} h
        </div>
      )}
      {!running ? (
        <Button
          size="sm"
          className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
          onClick={start}
        >
          <Play className="mr-1 h-3.5 w-3.5" /> IN
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          className="h-8 px-3"
          onClick={stopGuarded}
        >
          <Square className="mr-1 h-3.5 w-3.5" /> OUT
        </Button>
      )}
    </div>
  );
}

/* ===================== UI helpers ===================== */
function PriorityBadge({ p }: { p: Priority }) {
  if (p === "High")
    return (
      <Badge className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
        High
      </Badge>
    );
  if (p === "Medium")
    return (
      <Badge className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        Medium
      </Badge>
    );
  return (
    <Badge className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
      Low
    </Badge>
  );
}
function StatusBadge({ s }: { s: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    todo: "bg-slate-100 text-slate-700",
    in_progress: "bg-blue-100 text-blue-700",
    done: "bg-emerald-100 text-emerald-700",
  };
  const labels: Record<TaskStatus, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };
  return (
    <Badge
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
        map[s]
      )}
    >
      {labels[s]}
    </Badge>
  );
}
const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const MiniUserChip = ({ name, email }: { name: string; email: string }) => {
  const ini = initialsOf(name);
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 shadow-sm">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-[10px]">{ini}</AvatarFallback>
      </Avatar>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-slate-700">{name}</span>
        <span className="hidden text-xs text-slate-500 sm:inline">{email}</span>
      </div>
    </div>
  );
};

/* ===================== Filters util ===================== */
export function applyTaskFilters(
  tasks: Task[],
  _statusFilters: { todo: boolean; in_progress: boolean; done: boolean },
  f: TableFilters
): Task[] {
  let result = tasks.slice();
  if (f.searchTask.trim()) {
    const q = f.searchTask.trim().toLowerCase();
    result = result.filter((t) => t.name.toLowerCase().includes(q));
  }
  if (f.searchSubject.trim()) {
    const q = f.searchSubject.trim().toLowerCase();
    result = result.filter((t) => (t.subject || "").toLowerCase().includes(q));
  }
  if (f.priority) result = result.filter((t) => t.priority === f.priority);
  if (f.status) result = result.filter((t) => t.status === f.status);
  if (f.assignee === "unassigned") {
    result = result.filter((t) => !t.assignedTo?.length);
  } else if (f.assignee) {
    const email = f.assignee.toLowerCase();
    result = result.filter((t) =>
      (t.assignedTo || []).some((e) => e.toLowerCase() === email)
    );
  }
  return result;
}

/* ===================== Task Row (LIST view) ===================== */
function TaskRow({
  projectId,
  projectTitle,
  t,
  email,
}: {
  projectId: string;
  projectTitle?: string;
  t: Task;
  email: string;
}) {
  // state للنوت والإيقاف
  const [pendingStop, setPendingStop] = useState<null | (() => void)>(null);
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState(false);
  const noteKey = `${tKey(projectId, t.id, email)}${NOTE_SUFFIX}`;

  // لما التايمر يطلب إيقاف، نُظهر الحقل بجانب OPEN
  function handleRequestStop(proceed: () => void) {
    setPendingStop(() => proceed);
    setNoteErr(false);
    setNote("");
  }

  function cancelNote() {
    setPendingStop(null);
    setNote("");
    setNoteErr(false);
  }

  function commitNote() {
    if (!note.trim()) {
      setNoteErr(true);
      return;
    }
    try {
      localStorage.setItem(
        noteKey,
        JSON.stringify({ note: note.trim(), at: Date.now() })
      );
    } catch {}
    const doStop = pendingStop;
    cancelNote();
    doStop?.();
  }

  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-24">
      {/* اليسار */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          {projectTitle && (
            <span className="text-[11px] font-medium text-slate-500">
              {projectTitle}
            </span>
          )}
          <span className="text-[15px] font-semibold text-slate-800 truncate">
            {t.name}
          </span>
        </div>

        <div className="mt-1 text-[13.5px] text-slate-600 line-clamp-2">
          {t.subject}
        </div>

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

      {/* اليمين */}
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="outline" className="h-8 px-3 rounded-md gap-1">
          <ToggleLeft className="h-4 w-4" />
          OPEN
        </Button>

        {/* حقل النوت بجانب OPEN يظهر عند الضغط على OUT */}
        {pendingStop && (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              placeholder="Write note to stop…"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (noteErr && e.target.value.trim()) setNoteErr(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitNote();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelNote();
                }
              }}
              className={cn(
                "h-8 w-56",
                noteErr && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            <Button size="sm" className="h-8 px-2" onClick={commitNote} title="Log & stop">
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={cancelNote}
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <TaskTimer
          projectId={projectId}
          taskId={t.id}
          email={email}
          estHours={t.estHours}
          onRequestStop={handleRequestStop}
          onStopped={() => {
            /* مكان لأي أكشن بعد الإيقاف */
          }}
        />
      </div>
    </div>
  );
}

/* ===================== Filters Bar (Sticky) ===================== */
function FiltersBar({
  project,
  tableFilters,
  setTableFilters,
  clearTableFilters,
}: {
  project: Project;
  tableFilters: TableFilters;
  setTableFilters: (f: TableFilters) => void;
  clearTableFilters: () => void;
}) {
  return (
    <div className="sticky top-0 z-[1] bg-slate-50/80 backdrop-blur rounded-t-xl px-3 py-3">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
        <Input
          placeholder="Filter task…"
          value={tableFilters.searchTask}
          onChange={(e) =>
            setTableFilters({ ...tableFilters, searchTask: e.target.value })
          }
          className="h-9"
        />
        <Input
          placeholder="Filter subject…"
          value={tableFilters.searchSubject}
          onChange={(e) =>
            setTableFilters({ ...tableFilters, searchSubject: e.target.value })
          }
          className="h-9"
        />

        <div className="space-y-1">
          <div className="px-1 text-[11px] font-medium text-slate-500">
            Priority
          </div>
          <Select
            value={tableFilters.priority || "ANY"}
            onValueChange={(v) =>
              setTableFilters({
                ...tableFilters,
                priority: v === "ANY" ? "" : (v as TableFilters["priority"]),
              })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <div className="px-1 text-[11px] font-medium text-slate-500">
            Status
          </div>
          <Select
            value={tableFilters.status || "ANY"}
            onValueChange={(v) =>
              setTableFilters({
                ...tableFilters,
                status: v === "ANY" ? "" : (v as TableFilters["status"]),
              })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <div className="px-1 text-[11px] font-medium text-slate-500">
              Member
            </div>
            <Select
              value={tableFilters.assignee || "ANY"}
              onValueChange={(v) =>
                setTableFilters({
                  ...tableFilters,
                  assignee: v === "ANY" ? "" : v,
                })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">Any</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {project.members.map((m) => (
                  <SelectItem key={m.email} value={m.email}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-9 gap-1"
            onClick={clearTableFilters}
          >
            <X className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ===================== Page ===================== */
export default function Admin() {
  const viewer = useMemo(() => getCurrentUserFromStorage() ?? DEFAULT_USER, []);
  const [projects, setProjects] = useState<Project[]>(
    JSON.parse(JSON.stringify(BASE_PROJECTS)) as Project[]
  );
  const [projectId, setProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );

  const [tableFilters, setTableFilters] = useState<TableFilters>({
    searchTask: "",
    searchSubject: "",
    priority: "",
    status: "",
    assignee: "",
  });

  function clearTableFilters() {
    setTableFilters({
      searchTask: "",
      searchSubject: "",
      priority: "",
      status: "",
      assignee: "",
    });
  }

  useEffect(() => {
    if (!projects.find((p) => p.id === projectId) && projectId !== "all")
      setProjectId(projects[0]?.id ?? null);
  }, [projects, projectId]);

  const current = useMemo(() => {
    if (projectId === "all") {
      const mergedMembersMap = new Map<string, Employee>();
      projects.forEach((p) =>
        p.members.forEach((m) => mergedMembersMap.set(m.email.toLowerCase(), m))
      );
      const mergedTasks = projects.flatMap((p) => p.tasks);
      return {
        id: "all",
        title: "All Projects",
        members: Array.from(mergedMembersMap.values()),
        tasks: mergedTasks,
      } as Project;
    }
    return projects.find((p) => p.id === projectId) || null;
  }, [projects, projectId]);

  const counts = useMemo(() => {
    if (!current) return { todo: 0, in_progress: 0, done: 0, total: 0 };
    const c = current.tasks.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      { todo: 0, in_progress: 0, done: 0 } as Record<TaskStatus, number>
    );
    return { ...c, total: current.tasks.length };
  }, [current]);

  function resetView() {
    setProjects(JSON.parse(JSON.stringify(BASE_PROJECTS)) as Project[]);
    clearTableFilters();
  }

  const STATUS_ALL = { todo: true, in_progress: true, done: true };
  const filteredTasks = useMemo(
    () =>
      current ? applyTaskFilters(current.tasks, STATUS_ALL, tableFilters) : [],
    [current, tableFilters]
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-2 min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="mb-2 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
            <MiniUserChip name={viewer.name} email={viewer.email} />
          </div>
          <Button variant="outline" className="gap-2" onClick={resetView}>
            <RefreshCw className="h-4 w-4" /> Reset view
          </Button>
        </div>
      </div>

      {/* Project picker + stats */}
      <div className="grid gap-3 sm:grid-cols-2 mb-2 shrink-0">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 pb-2">
            <Select
              value={projectId ?? undefined}
              onValueChange={(v) => setProjectId(v)}
            >
              <SelectTrigger className="h-10 w-full rounded-lg bg-slate-50">
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent className="w-[--radix-select-trigger-width]">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg border bg-white px-2 py-1">
                <div className="text-[10px] text-slate-500">Total</div>
                <div className="text-sm font-semibold text-slate-800 tabular-nums">
                  {counts.total}
                </div>
              </div>
              <div className="rounded-lg border bg-white px-2 py-1">
                <div className="text-[10px] text-slate-500">To Do</div>
                <div className="text-sm font-semibold text-slate-800 tabular-nums">
                  {counts.todo}
                </div>
              </div>
              <div className="rounded-lg border bg-white px-2 py-1">
                <div className="text-[10px] text-blue-600/70">In Progress</div>
                <div className="text-sm font-semibold text-slate-800 tabular-nums">
                  {counts.in_progress}
                </div>
              </div>
              <div className="rounded-lg border bg-white px-2 py-1">
                <div className="text-[10px] text-emerald-600/70">Done</div>
                <div className="text-sm font-semibold text-slate-800 tabular-nums">
                  {counts.done}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CARD — سكروول داخلي، رأس ثابت */}
      {current && (
        <Card className="flex-1 flex flex-col min-h-[clamp(560px,80vh,1100px)]">
          <CardHeader className="pb-0 shrink-0">
            <CardTitle className="text-base">{current.title}</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 min-h-0 p-0">
            <div className="h-full flex flex-col">
              <FiltersBar
                project={current}
                tableFilters={tableFilters}
                setTableFilters={setTableFilters}
                clearTableFilters={clearTableFilters}
              />
              <div className="flex-1 min-h-0 overflow-auto p-3 space-y-2">
                {filteredTasks.map((t) => {
                  const parent =
                    projectId === "all"
                      ? projects.find((p) => p.tasks.some((x) => x.id === t.id))
                      : current;

                  return (
                    <TaskRow
                      key={`${parent?.id || "all"}_${t.id}`}
                      projectId={parent?.id || "all"}
                      projectTitle={parent?.title}
                      t={t}
                      email={viewer.email.toLowerCase()}
                    />
                  );
                })}
                {filteredTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
                    No tasks match the selected filters.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ===================== Dev sanity tests ===================== */
if ((import.meta as any)?.env?.DEV) {
  const demoTasks: Task[] = [
    { id: "1", name: "Auth", subject: "alpha", priority: "High", status: "todo", estHours: 5 },
    { id: "2", name: "API", subject: "beta", priority: "Low", status: "done", estHours: 2 },
  ];
  const STATUS_ALL = { todo: true, in_progress: true, done: true };
  const none: TableFilters = { searchTask: "", searchSubject: "", priority: "", status: "", assignee: "" };

  console.assert(applyTaskFilters(demoTasks, STATUS_ALL, none).length === 2, "filters: default returns all");
  console.assert(applyTaskFilters(demoTasks, STATUS_ALL, { ...none, priority: "High" }).length === 1, "filters: priority");
  console.assert(applyTaskFilters(demoTasks, STATUS_ALL, { ...none, status: "done" }).length === 1, "filters: status");
  console.assert(applyTaskFilters(demoTasks, STATUS_ALL, { ...none, searchTask: "api" }).length === 1, "filters: task text");
  console.assert(applyTaskFilters(demoTasks, STATUS_ALL, { ...none, searchSubject: "alp" }).length === 1, "filters: subject text");
}
