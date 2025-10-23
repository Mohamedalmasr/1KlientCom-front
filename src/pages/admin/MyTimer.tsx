import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";

import { AUTH_KEY } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type SessionEntry = {
  projectId: string;
  taskId: string;
  start: number;
  end: number;
  durationMs: number;
};

type CurrentUser = {
  email: string;
  name: string;
};

type DailySummary = {
  key: number;
  day: Date;
  sessions: number;
  totalMs: number;
};

type WeekSummary = {
  key: number;
  start: Date;
  end: Date;
  sessions: number;
  totalMs: number;
};

type MonthSummary = {
  key: string;
  start: Date;
  sessions: number;
  totalMs: number;
};

const TIMER_PREFIX = "ok_time_";
const SESSIONS_SUFFIX = "_sessions";
const NOTE_SUFFIX = "_last_note";

const WEEKDAY_FORMAT = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const DAY_LABEL_FORMAT = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});
const WEEK_RANGE_FORMAT = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});
const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

const pad = (value: number) => (value < 10 ? `0${value}` : `${value}`);

const normalizeDuration = (durationMs: unknown, start: number, end: number) => {
  const numeric = Number(durationMs);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  if (Number.isFinite(start) && Number.isFinite(end)) {
    return Math.max(end - start, 0);
  }
  return 0;
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date: Date) => {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 (Sun) -> 6 (Sat)
  const diff = (day + 6) % 7; // convert to Monday-first index
  d.setDate(d.getDate() - diff);
  return d;
};

const endOfWeek = (weekStart: Date) => {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return startOfDay(d);
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const monthKeyFromDate = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}`;

const formatHours = (ms: number) => (Math.max(ms, 0) / 3_600_000).toFixed(2);

const formatHhMm = (ms: number) => {
  const totalSeconds = Math.floor(Math.max(ms, 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${pad(hours)}:${pad(minutes)}`;
};

const formatWeekRange = (start: Date, end: Date) =>
  `${WEEK_RANGE_FORMAT.format(start)} – ${WEEK_RANGE_FORMAT.format(end)}`;

const parseJSON = (raw: string | null) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const resolveCurrentUser = (): CurrentUser | null => {
  if (typeof window === "undefined") return null;

  const authUser = parseJSON(localStorage.getItem("authUser"));
  const auth = parseJSON(localStorage.getItem("auth"));
  const legacyUser = parseJSON(localStorage.getItem("user"));
  const okAuth = parseJSON(localStorage.getItem(AUTH_KEY));

  const candidates = [
    authUser,
    auth && typeof auth === "object" ? (auth as any).user ?? auth : null,
    legacyUser,
    okAuth && typeof okAuth === "object" ? (okAuth as any).user ?? okAuth : null,
  ].filter(Boolean) as Array<any>;

  for (const entry of candidates) {
    const emailRaw =
      entry.email ??
      entry.Email ??
      entry.emailAddress ??
      entry.userEmail ??
      null;
    if (!emailRaw || typeof emailRaw !== "string") continue;
    const email = emailRaw.toLowerCase();
    const first = typeof entry.firstName === "string" ? entry.firstName : "";
    const last = typeof entry.lastName === "string" ? entry.lastName : "";
    const display =
      [first, last]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ") ||
      (typeof entry.name === "string" ? entry.name : "") ||
      email.split("@")[0] ||
      email;

    return {
      email,
      name: display.trim(),
    };
  }

  return null;
};

const loadSessionsForEmail = (email: string): SessionEntry[] => {
  if (typeof window === "undefined") return [];

  const normalizedEmail = email.toLowerCase();
  const sessions: SessionEntry[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(TIMER_PREFIX)) continue;
    if (key.endsWith(NOTE_SUFFIX)) continue;
    if (!key.endsWith(SESSIONS_SUFFIX)) continue;

    const base = key.slice(
      TIMER_PREFIX.length,
      key.length - SESSIONS_SUFFIX.length
    );
    const parts = base.split("_");
    if (parts.length < 3) continue;

    const emailPart = parts.pop()!;
    if (emailPart.toLowerCase() !== normalizedEmail) continue;
    const taskId = parts.pop() ?? "";
    const projectId = parts.join("_") || "unknown";

    let parsed: unknown;
    try {
      parsed = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      parsed = [];
    }
    if (!Array.isArray(parsed)) continue;

    for (const raw of parsed) {
      if (!raw) continue;
      const start = Number((raw as any).start ?? (raw as any).startedAt);
      const end = Number((raw as any).end ?? (raw as any).stoppedAt);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const duration = normalizeDuration((raw as any).durationMs, start, end);
      if (duration <= 0) continue;

      sessions.push({
        projectId,
        taskId,
        start,
        end,
        durationMs: duration,
      });
    }
  }

  sessions.sort((a, b) => a.start - b.start);
  return sessions;
};

const computeAggregates = (sessions: SessionEntry[]) => {
  const dailyMap = new Map<number, DailySummary>();
  const weeklyMap = new Map<number, WeekSummary>();
  const monthlyMap = new Map<string, MonthSummary>();

  for (const session of sessions) {
    const startDate = new Date(session.start);
    if (Number.isNaN(startDate.getTime())) continue;
    const duration = Math.max(session.durationMs, 0);
    if (duration <= 0) continue;

    const dayStart = startOfDay(startDate);
    const dayKey = dayStart.getTime();
    const daySummary =
      dailyMap.get(dayKey) ?? {
        key: dayKey,
        day: dayStart,
        sessions: 0,
        totalMs: 0,
      };
    daySummary.sessions += 1;
    daySummary.totalMs += duration;
    dailyMap.set(dayKey, daySummary);

    const weekStart = startOfWeek(startDate);
    const weekKey = weekStart.getTime();
    const weekSummary =
      weeklyMap.get(weekKey) ?? {
        key: weekKey,
        start: weekStart,
        end: endOfWeek(weekStart),
        sessions: 0,
        totalMs: 0,
      };
    weekSummary.sessions += 1;
    weekSummary.totalMs += duration;
    weeklyMap.set(weekKey, weekSummary);

    const monthStart = startOfMonth(startDate);
    const monthKey = monthKeyFromDate(monthStart);
    const monthSummary =
      monthlyMap.get(monthKey) ?? {
        key: monthKey,
        start: monthStart,
        sessions: 0,
        totalMs: 0,
      };
    monthSummary.sessions += 1;
    monthSummary.totalMs += duration;
    monthlyMap.set(monthKey, monthSummary);
  }

  const dailySummaries = Array.from(dailyMap.values()).sort(
    (a, b) => a.key - b.key
  );
  const weeklySummaries = Array.from(weeklyMap.values()).sort(
    (a, b) => a.key - b.key
  );
  const monthlySummaries = Array.from(monthlyMap.values()).sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  return {
    dailySummaries,
    weeklySummaries,
    monthlySummaries,
    dailyMap,
    weeklyMap,
    monthlyMap,
  };
};

function MyTimer() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const load = () => {
      const nextUser = resolveCurrentUser();
      setUser(nextUser);
      if (nextUser) {
        setSessions(loadSessionsForEmail(nextUser.email));
      } else {
        setSessions([]);
      }
      setHydrated(true);
    };

    const handleStorage = () => load();
    const handleFocus = () => load();

    load();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("ok-timer-update", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("ok-timer-update", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const aggregates = useMemo(() => computeAggregates(sessions), [sessions]);

  const today = startOfDay(new Date());
  const currentWeekStart = startOfWeek(today);
  const currentWeekEnd = endOfWeek(currentWeekStart);
  const currentWeekKey = currentWeekStart.getTime();
  const currentWeekSummary =
    aggregates.weeklyMap.get(currentWeekKey) ?? null;
  const currentMonthStart = startOfMonth(today);
  const currentMonthKey = monthKeyFromDate(currentMonthStart);
  const currentMonthSummary =
    aggregates.monthlyMap.get(currentMonthKey) ?? null;

  const totalMsAll = useMemo(
    () => sessions.reduce((sum, s) => sum + Math.max(s.durationMs, 0), 0),
    [sessions]
  );

  const totalSessionsAll = sessions.length;

  const weekDays = useMemo(() => {
    const base = new Date(currentWeekStart);
    const list = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(base);
      day.setDate(day.getDate() + i);
      const key = day.getTime();
      const summary = aggregates.dailyMap.get(key);
      list.push({
        date: day,
        sessions: summary?.sessions ?? 0,
        totalMs: summary?.totalMs ?? 0,
        isToday: key === today.getTime(),
      });
    }
    return list;
  }, [aggregates.dailyMap, currentWeekStart, today]);

  const recentWeeks = useMemo(
    () =>
      [...aggregates.weeklySummaries]
        .reverse()
        .slice(0, 8),
    [aggregates.weeklySummaries]
  );

  const recentMonths = useMemo(
    () =>
      [...aggregates.monthlySummaries]
        .reverse()
        .slice(0, 6),
    [aggregates.monthlySummaries]
  );

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Timer overview unavailable</CardTitle>
            <CardDescription>
              We could not find your profile information. Try signing in again
              to view your personal timer analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const hasSessions = sessions.length > 0;
  const weekTotalMs = currentWeekSummary?.totalMs ?? 0;
  const monthTotalMs = currentMonthSummary?.totalMs ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">My Timer</h1>
        <p className="text-sm text-muted-foreground">
          {hasSessions
            ? "Overview of your recorded sessions across the week and month."
            : "Start a timer on any task to populate your weekly and monthly totals."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Total sessions
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {totalSessionsAll}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Total tracked
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {formatHours(totalMsAll)} h
            </div>
            <div className="text-xs text-muted-foreground">
              ({formatHhMm(totalMsAll)} hh:mm)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Weeks logged
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {aggregates.weeklySummaries.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Months logged
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
              {aggregates.monthlySummaries.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>This week</CardTitle>
            <CardDescription>
              {formatWeekRange(currentWeekStart, currentWeekEnd)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <CalendarDays className="mr-1 h-3.5 w-3.5" />
              {weekTotalMs > 0
                ? `${formatHours(weekTotalMs)} h`
                : "0.00 h"}{" "}
              • {currentWeekSummary?.sessions ?? 0} sessions
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {weekDays.map(({ date, sessions: count, totalMs, isToday }) => {
              const hasWork = totalMs > 0;
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md",
                    isToday && "border-emerald-500 shadow-md",
                    !hasWork && "border-dashed text-muted-foreground"
                  )}
                >
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>{WEEKDAY_FORMAT.format(date)}</span>
                    <span>{DAY_LABEL_FORMAT.format(date)}</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tabular-nums">
                    {formatHours(totalMs)} h
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {count} session{count === 1 ? "" : "s"}
                  </div>
                  {isToday && (
                    <Badge className="mt-3 text-[11px]" variant="outline">
                      Today
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          {!hasSessions && (
            <div className="rounded-lg border border-dashed bg-slate-50/60 px-4 py-3 text-sm text-muted-foreground">
              No sessions recorded this week. Start a timer to track your work.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>History</CardTitle>
            <CardDescription>
              Switch between weekly and monthly totals to review your progress.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Current month:{" "}
            {MONTH_LABEL_FORMAT.format(currentMonthStart)} •{" "}
            {monthTotalMs > 0 ? `${formatHours(monthTotalMs)} h` : "0.00 h"} •{" "}
            {currentMonthSummary?.sessions ?? 0} sessions
          </Badge>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly" className="space-y-4">
            <TabsList className="gap-2">
              <TabsTrigger value="weekly" className="text-sm">
                Weekly totals
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-sm">
                Monthly totals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="space-y-3">
              {recentWeeks.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-slate-50 px-4 py-6 text-center text-sm text-muted-foreground">
                  No weeks recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Week</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Total hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentWeeks.map((week) => (
                      <TableRow key={week.key}>
                        <TableCell className="font-medium">
                          {formatWeekRange(week.start, week.end)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {week.sessions}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatHours(week.totalMs)} h
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="monthly" className="space-y-3">
              {recentMonths.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-slate-50 px-4 py-6 text-center text-sm text-muted-foreground">
                  No months recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Month</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Total hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMonths.map((month) => (
                      <TableRow key={month.key}>
                        <TableCell className="font-medium">
                          {MONTH_LABEL_FORMAT.format(month.start)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {month.sessions}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatHours(month.totalMs)} h
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily log</CardTitle>
          <CardDescription>
            Detailed breakdown of each day you tracked time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aggregates.dailySummaries.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-slate-50 px-4 py-6 text-center text-sm text-muted-foreground">
              Track your first session to populate the daily log.
            </div>
          ) : (
            <div className="space-y-3">
              {aggregates.dailySummaries
                .slice()
                .reverse()
                .map((day) => (
                  <div
                    key={day.key}
                    className="rounded-lg border bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {WEEKDAY_FORMAT.format(day.day)}
                        </Badge>
                        <span className="text-sm font-medium text-slate-800">
                          {DAY_LABEL_FORMAT.format(day.day)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="tabular-nums">
                          {day.sessions} session{day.sessions === 1 ? "" : "s"}
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="tabular-nums font-semibold text-slate-900">
                          {formatHours(day.totalMs)} h
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({formatHhMm(day.totalMs)} hh:mm)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MyTimer;
