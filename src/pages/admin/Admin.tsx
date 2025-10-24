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
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  Play,
  Square,
  RefreshCw,
  X,
  ToggleLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  assignedTo?: string[];
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
  assignee: "" | "unassigned" | string;
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
const SESSIONS_SUFFIX = "_sessions";

type SessionLog = {
  start: number;
  end: number;
  durationMs: number;
  note?: string;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
};
const to1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

const SESSION_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const formatSessionTime = (value: number) => {
  if (!value || Number.isNaN(value)) return "-";
  return SESSION_TIME_FORMATTER.format(new Date(value));
};

const formatSessionHours = (ms: number) => {
  if (!ms || !Number.isFinite(ms)) return "0.00";
  const hours = Math.max(ms, 0) / 3600000;
  return hours.toFixed(2);
};

const normalizeSessionDuration = (
  durationMs: number | undefined,
  start: number,
  end: number
) => {
  if (Number.isFinite(durationMs)) {
    return Math.max(Number(durationMs), 0);
  }
  return Math.max(end - start, 0);
};

const tKey = (projectId: string, taskId: string, email: string) =>
  `${TIMER_PREFIX}${projectId}_${taskId}_${email}`;
const sessionsKey = (projectId: string, taskId: string, email: string) =>
  `${tKey(projectId, taskId, email)}${SESSIONS_SUFFIX}`;

function appendSession(
  projectId: string,
  taskId: string,
  email: string,
  session: SessionLog
) {
  try {
    const k = sessionsKey(projectId, taskId, email);
    const list: SessionLog[] = JSON.parse(localStorage.getItem(k) || "[]");
    list.push(session);
    localStorage.setItem(k, JSON.stringify(list));
    window.dispatchEvent(new Event("ok-timer-update"));
  } catch {}
}

function readAllParticipantsForTask(projectId: string, taskId: string) {
  const participants: Record<
    string,
    { email: string; totalMs: number; sessions: SessionLog[] }
  > = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || "";
    const prefix = `${TIMER_PREFIX}${projectId}_${taskId}_`;
    if (!key.startsWith(prefix)) continue;

    // تجاهل مفاتيح النوت
    if (key.endsWith(NOTE_SUFFIX)) continue;

    if (!key.endsWith(SESSIONS_SUFFIX)) {
      const email = key.slice(prefix.length);
      if (!participants[email]) {
        participants[email] = { email, totalMs: 0, sessions: [] };
      }
      try {
        const t = JSON.parse(localStorage.getItem(key) || "{}");
        participants[email].totalMs = Number(t?.totalMs || 0);
      } catch {}
      continue;
    }

    const email = key.slice(
      prefix.length,
      key.length - SESSIONS_SUFFIX.length
    );
    if (!participants[email]) {
      participants[email] = { email, totalMs: 0, sessions: [] };
    }
    try {
      participants[email].sessions = JSON.parse(
        localStorage.getItem(key) || "[]"
      );
    } catch {}
  }
  return Object.values(participants);
}

function humanHours(ms: number) {
  return (Math.round((ms / 3600000) * 10) / 10).toFixed(1);
}

/* ===================== TaskTimer ===================== */
function TaskTimer({
  projectId,
  taskId,
  email,
  onRequestStop,
  onStopped,
}: {
  projectId: string;
  taskId: string;
  email: string;
  estHours?: number;
  onRequestStop?: (proceed: () => void) => void;
  onStopped?: (info: {
    totalMs: number;
    startedAt: number;
    stoppedAt: number;
  }) => void;
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

  const doStop = () => {
    if (!running || !startedAt) return;
    const now = Date.now();
    const sum = total + (now - startedAt);
    setRunning(false);
    setStartedAt(null);
    setTotal(sum);
    persist({ running: false, totalMs: sum, startedAt: null });
    onStopped?.({ totalMs: sum, startedAt, stoppedAt: now });
  };

  function stopGuarded() {
    if (onRequestStop) return onRequestStop(doStop);
    doStop();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs text-slate-700">
        <Clock className={cn("h-3.5 w-3.5", running && "animate-pulse")} />
        <span className="tabular-nums">{fmt(elapsed)}</span>
      </div>
      {!running ? (
        <Button
          size="sm"
          className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
          onClick={start}
        >
          <Play className="mr-1 h-3.5 w-3.5" /> Start
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          className="h-8 px-3"
          onClick={stopGuarded}
        >
          <Square className="mr-1 h-3.5 w-3.5" /> End
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

/* ========= TinyStat helper ========= */
function TinyStat({
  value,
  label,
  tone = "slate",
  className,
}: {
  value: string | number;
  label: string;
  tone?: "slate" | "blue" | "emerald";
  className?: string;
}) {
  const toneMap: Record<string, string> = {
    slate: "border-slate-200 text-slate-600 bg-white",
    blue: "border-blue-200 text-blue-700 bg-blue-50/60",
    emerald: "border-emerald-200 text-emerald-700 bg-emerald-50/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11.5px] font-medium tabular-nums",
        toneMap[tone],
        className
      )}
      title={String(label)}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{value}</span>
      <span className="opacity-80">{label}</span>
    </span>
  );
}

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

/* ===================== Task Details Sheet ===================== */
function TaskDetailsSheet({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  task,
  members,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  projectTitle?: string;
  task: Task;
  members: Employee[];
}) {
  const data = useMemo(
    () => readAllParticipantsForTask(projectId, task.id),
    [open, projectId, task.id]
  );
  const totalMsAll = data.reduce((s, p) => s + (p.totalMs || 0), 0);
  const totalSessions = data.reduce((s, p) => s + (p.sessions?.length || 0), 0);
  const byEmail: Record<string, Employee | undefined> = Object.fromEntries(
    members.map((m) => [m.email.toLowerCase(), m])
  );
  const displayName = (email: string) =>
    byEmail[email.toLowerCase()]?.name || email.split("@")[0];
  const [sessionNoteViewer, setSessionNoteViewer] = useState<
    | null
    | {
        member: string;
        note: string;
        start: number;
        end: number;
        durationMs: number;
      }
  >(null);
  const handleSessionNoteOpen = (member: string, session: SessionLog) => {
    const noteText = (session.note || "").trim();
    if (!noteText) return;
    setSessionNoteViewer({
      member,
      note: noteText,
      start: session.start,
      end: session.end,
      durationMs: session.durationMs,
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col p-0 [&>button:last-of-type]:hidden"
      >
        <div className="absolute left-2 top-2">
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full"
              title="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </div>

        {/* Header */}
        <div className="px-16 pr-6 pt-10">
          <SheetHeader className="items-start text-left space-y-1">
            <SheetTitle className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-800 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {projectTitle ? (
                <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-500">
                  <span>{projectTitle}</span>
                  <span className="text-slate-400" aria-hidden>
                    {"\u2022"}
                  </span>
                </span>
              ) : null}
              <span>{task.name}</span>
            </SheetTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <PriorityBadge p={task.priority} />
              <StatusBadge s={task.status} />
              {typeof task.estHours === "number" && (
                <span className="text-xs text-slate-600">{task.estHours} Est. hrs</span>
              )}
            </div>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              {task.subject}
            </p>
          </SheetHeader>
        </div>

        {/* Scroll area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-16 pr-6 pb-6 space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border bg-white px-4 py-3">
              <div className="text-[11px] text-slate-500">Assignees (worked)</div>
              <div className="text-2xl font-semibold tabular-nums">{data.length}</div>
            </div>
            <div className="rounded-xl border bg-white px-4 py-3">
              <div className="text-[11px] text-slate-500">Sessions</div>
              <div className="text-2xl font-semibold tabular-nums">{totalSessions}</div>
            </div>
            <div className="rounded-xl border bg-white px-4 py-3">
              <div className="text-[11px] text-slate-500">Total time (h)</div>
              <div className="text-2xl font-semibold tabular-nums">
                {humanHours(totalMsAll)}
              </div>
            </div>
          </div>

          {/* People */}
          <div>
            <div className="mb-2 text-[11px] font-medium text-slate-500">People</div>
            <div className="space-y-2">
              {data.map((p) => {
                const name = displayName(p.email);
                const ini = initialsOf(name);
                return (
                  <div
                    key={p.email}
                    className="flex items-center justify-between rounded-lg border bg-white px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">{ini}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {p.sessions.length} sessions • {humanHours(p.totalMs)} h
                    </div>
                  </div>
                );
              })}
              {data.length === 0 && (
                <div className="rounded-lg border border-dashed px-3 py-3 text-sm text-slate-500">
                  لا يوجد نشاط مسجل بعد على هذه التسك.
                </div>
              )}
            </div>
          </div>

          {/* Session log */}
          {data.some((p) => p.sessions.length) && (
            <div>
              <div className="mb-2 text-[11px] font-medium text-slate-500">
                Session log
              </div>

              <div className="hidden md:grid grid-cols-12 bg-slate-50/60 px-3 py-2 rounded-t-lg border border-b-0">
                <div className="col-span-4 text-[11px] font-medium text-slate-600">
                  Member
                </div>
                <div className="col-span-2 text-[11px] font-medium text-slate-600">
                  Start
                </div>
                <div className="col-span-2 text-[11px] font-medium text-slate-600">
                  End
                </div>
                <div className="col-span-2 text-[11px] font-medium text-slate-600">
                  Total (hrs)
                </div>
                <div className="col-span-2 text-[11px] font-medium text-slate-600">
                  Note
                </div>
              </div>

              <div className="border rounded-lg md:rounded-t-none overflow-hidden">
                {data.flatMap((p) =>
                  p.sessions.map((s, i) => {
                    const noteText = (s.note || "").trim();
                    const memberName = displayName(p.email);
                    const canOpenNote = noteText.length > 0;
                    const safeDurationMs = normalizeSessionDuration(
                      s.durationMs,
                      s.start,
                      s.end
                    );
                    const durationHours = formatSessionHours(safeDurationMs);
                    const durationDisplay = `${durationHours} h`;

                    return (
                      <div
                        key={`${p.email}_${i}`}
                        className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-0 px-3 py-2 border-t first:border-t-0"
                      >
                        {canOpenNote ? (
                          <button
                            type="button"
                            onClick={() => handleSessionNoteOpen(memberName, s)}
                            aria-label={`View full note from ${memberName}`}
                            className="md:col-span-4 cursor-pointer text-left text-[13px] font-medium text-slate-800 truncate rounded-md transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                          >
                            {memberName}
                          </button>
                        ) : (
                          <div className="md:col-span-4 text-[13px] font-medium text-slate-800 truncate">
                            {memberName}
                          </div>
                        )}
                        <div className="md:col-span-2 text-[13px] tabular-nums">
                          {formatSessionTime(s.start)}
                        </div>
                        <div className="md:col-span-2 text-[13px] tabular-nums">
                          {formatSessionTime(s.end)}
                        </div>
                        <div className="md:col-span-2 text-[13px] tabular-nums" title={durationDisplay}>
                          {durationDisplay}
                        </div>
                        <div
                          className="md:col-span-2 text-[13px] text-slate-600 line-clamp-1 break-words"
                          title={noteText || undefined}
                        >
                          {noteText || "-"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="px-16 pr-6 pb-6" />
      </SheetContent>
    </Sheet>

    <Dialog
      open={!!sessionNoteViewer}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSessionNoteViewer(null);
        }
      }}
    >
      {sessionNoteViewer ? (
        <DialogContent className="sm:max-w-2xl w-[min(92vw,760px)]">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle>{sessionNoteViewer.member}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {new Date(sessionNoteViewer.start).toLocaleDateString()} |{" "}
              {formatSessionTime(sessionNoteViewer.start)} -{" "}
              {formatSessionTime(sessionNoteViewer.end)} |{" "}
              {formatSessionHours(
                normalizeSessionDuration(
                  sessionNoteViewer.durationMs,
                  sessionNoteViewer.start,
                  sessionNoteViewer.end
                )
              )}{" "}
              h
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words break-all text-[15px] leading-6 text-slate-700 rounded-md border bg-slate-50 p-4">
            {sessionNoteViewer.note}
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  </>
  );
}

/* ===================== Task Row (LIST view) ===================== */
function TaskRow({
  projectId,
  projectTitle,
  t,
  email,
  members,
  projectTasks,
}: {
  projectId: string;
  projectTitle?: string;
  t: Task;
  email: string;
  members: Employee[];
  projectTasks: Task[];
}) {
  const [pendingStop, setPendingStop] = useState<null | (() => void)>(null);
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState(false);
  const [open, setOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const noteKey = `${tKey(projectId, t.id, email)}${NOTE_SUFFIX}`;

  function handleRequestStop(proceed: () => void) {
    setPendingStop(() => proceed);
    setNoteErr(false);
    setNote("");
    setNoteDialogOpen(true);
  }
  function cancelNote() {
    setPendingStop(null);
    setNote("");
    setNoteErr(false);
    setNoteDialogOpen(false);
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

  /* ===== Project totals (Spent / Est.) for display ===== */
  const [ver, setVer] = useState(0);
  useEffect(() => {
    const onUpd = () => setVer((v) => v + 1);
    window.addEventListener("ok-timer-update", onUpd);
    return () => window.removeEventListener("ok-timer-update", onUpd);
  }, []);

  const projectEstHours = useMemo(
    () => (projectTasks || []).reduce((sum, task) => sum + (task.estHours || 0), 0),
    [projectTasks]
  );

  const projectSpentMs = useMemo(() => {
    if (!projectTasks?.length) return 0;
    return projectTasks.reduce((acc, task) => {
      const participants = readAllParticipantsForTask(projectId, task.id);
      const taskMs = participants.reduce((s, p) => s + (p.totalMs || 0), 0);
      return acc + taskMs;
    }, 0);
  }, [projectId, projectTasks, ver]);

  const projectSpentH = (projectSpentMs / 3600000).toFixed(1);
  const projectEstH = to1(projectEstHours);

  const taskSpentMs = useMemo(() => {
    const participants = readAllParticipantsForTask(projectId, t.id);
    return participants.reduce((sum, p) => sum + (p.totalMs || 0), 0);
  }, [projectId, t.id, ver]);
  const taskSpentH = to1(taskSpentMs / 3600000);

  return (
    <>
      <div
        className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-24 cursor-pointer transition hover:bg-slate-50"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        role="button"
        tabIndex={0}
      >
        {/* اليسار */}
        <div className="min-w-0">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-start">
            <div className="min-w-0">
              {projectTitle && (
                <>
                  <span className="text-[11px] font-medium text-slate-500">
                    {projectTitle}
                  </span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <TinyStat
                      value={projectSpentH}
                      label="Spent hrs"
                      tone="blue"
                    />
                    <TinyStat
                      value={projectEstH}
                      label="Est. hrs"
                      tone="slate"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex min-w-0 flex-col items-start gap-1 text-left">
              <span className="text-[15px] font-semibold text-slate-800 truncate">
                {t.name}
              </span>
              <p className="mt-1 w-full text-[13.5px] text-slate-600 leading-relaxed line-clamp-2">
                {t.subject}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {taskSpentH} Spent hrs
                </span>
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
          </div>
        </div>

        {/* اليمين */}
        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            className="
              h-8 px-3 rounded-md gap-1
              sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity
            "
            title="Open task details"
          >
            <ToggleLeft className="h-4 w-4" />
            OPEN
          </Button>

          <TaskTimer
            projectId={projectId}
            taskId={t.id}
            email={email}
            estHours={t.estHours}
            onRequestStop={handleRequestStop}
            onStopped={({ startedAt, stoppedAt }) => {
              let noteText: string | undefined = undefined;
              try {
                const last = JSON.parse(localStorage.getItem(noteKey) || "null");
                if (last && Math.abs((last.at ?? 0) - stoppedAt) < 5000) {
                  noteText = last.note;
                }
              } catch {}
              appendSession(projectId, t.id, email, {
                start: startedAt,
                end: stoppedAt,
                durationMs: stoppedAt - startedAt,
                note: noteText,
              });
            }}
          />
        </div>
      </div>

      {/* Sheet */}
      <TaskDetailsSheet
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        projectTitle={projectTitle}
        task={t}
        members={members}
      />

      <Dialog
        open={noteDialogOpen}
        onOpenChange={(next) => {
          if (!next) cancelNote();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stop timer</DialogTitle>
            <DialogDescription>
              Add a quick note before stopping this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              autoFocus
              placeholder="Write note to stop..."
              value={note}
              rows={4}
              onChange={(e) => {
                setNote(e.target.value);
                if (noteErr && e.target.value.trim()) setNoteErr(false);
              }}
              className={cn(
                "resize-none",
                noteErr && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {noteErr && (
              <p className="text-xs text-red-500">Please add a note before saving.</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelNote}>
                Cancel
              </Button>
              <Button onClick={commitNote}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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

      {/* MAIN CARD */}
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
                      members={parent?.members || []}
                      projectTasks={parent?.tasks || []}
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
    {
      id: "1",
      name: "Auth",
      subject: "alpha",
      priority: "High",
      status: "todo",
      estHours: 5,
    },
    {
      id: "2",
      name: "API",
      subject: "beta",
      priority: "Low",
      status: "done",
      estHours: 2,
    },
  ];
  const STATUS_ALL = { todo: true, in_progress: true, done: true };
  const none: TableFilters = {
    searchTask: "",
    searchSubject: "",
    priority: "",
    status: "",
    assignee: "",
  };

  console.assert(
    applyTaskFilters(demoTasks, STATUS_ALL, none).length === 2,
    "filters: default returns all"
  );
  console.assert(
    applyTaskFilters(demoTasks, STATUS_ALL, { ...none, priority: "High" })
      .length === 1,
    "filters: priority"
  );
  console.assert(
    applyTaskFilters(demoTasks, STATUS_ALL, { ...none, status: "done" })
      .length === 1,
    "filters: status"
  );
  console.assert(
    applyTaskFilters(demoTasks, STATUS_ALL, { ...none, searchTask: "api" })
      .length === 1,
    "filters: task text"
  );
  console.assert(
    applyTaskFilters(demoTasks, STATUS_ALL, { ...none, searchSubject: "alp" })
      .length === 1,
    "filters: subject text"
  );
}
