// src/pages/admin/EditProject.tsx
import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Search, X, Plus, Edit2, Trash2, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  getAssignUsers,
  getProjectDetail,
  updateProject,
  createTask,
  updateTask,
  deleteTask,
  type AssignUser,
  type CreateTaskInput,
  type UpdateTaskInput,
  PROJECT_TYPES as API_PROJECT_TYPES,
} from "@/lib/api";

/* ===== أنواع و helpers (مطابقة لـ AddProjects) ===== */
type Employee = { id: string; name: string; email: string; avatar?: string };
type Priority = "High" | "Medium" | "Low";
type Task = { id: string; name: string; subject: string; hours: number; priority: Priority };

const FALLBACK_TYPES = [
  "Web Design & Development",
  "WordPress Expertise",
  "SEO & Growth",
  "Digital Marketing",
  "Performance & Security",
  "Maintenance & Support",
] as const;
const ALL_PROJECT_TYPES: string[] =
  (Array.isArray(API_PROJECT_TYPES) && API_PROJECT_TYPES.length
    ? API_PROJECT_TYPES
    : Array.from(FALLBACK_TYPES));

const numToPriority = (n?: number): Priority =>
  !n || n <= 1 ? "Low" : n === 2 ? "Medium" : "High";

/* ====== UI Component ====== */
export default function EditProject() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // details
  const [type, setType] = useState<string>(ALL_PROJECT_TYPES[0]);
  const [leader, setLeader] = useState<string>("");
  const [leaderId, setLeaderId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState("");
  const [due, setDue] = useState("");
  const [budget, setBudget] = useState("$0.00");
  const [status, setStatus] = useState<"On Track" | "Offtrack" | "Completed">("On Track");

  // team
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [team, setTeam] = useState<Employee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leadersPool, setLeadersPool] = useState<Employee[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  // tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [origTasks, setOrigTasks] = useState<Record<string, Task>>({});
  const [draft, setDraft] = useState<{ name: string; subject: string; hours: string; priority: Priority }>({
    name: "", subject: "", hours: "", priority: "High",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ open: boolean; kind: "success" | "error" | "info"; message: string; }>(
    { open: false, kind: "info", message: "" }
  );
  function showToast(message: string, kind: "success" | "error" | "info" = "info", ms = 3500) {
    setToast({ open: true, kind, message });
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => {
      setToast((t) => ({ ...t, open: false }));
    }, ms);
  }

  /* === load project detail === */
  useEffect(() => {
    (async () => {
      try {
        const d = await getProjectDetail(projectId);
        const p = d.project;

        setTitle(p.name ?? "");
        setDesc(p.projectDesc ?? "");
        setType(p.type ?? ALL_PROJECT_TYPES[0]);
        setStart(p.startDate ? p.startDate.slice(0, 10) : "");
        setDue(p.dueDate ? p.dueDate.slice(0, 10) : "");
        setBudget(p.budget ? String(p.budget) : "$0.00");
        setStatus((p.status as any) ?? "On Track");
        setLeaderId(p.leaderAID ?? null);

        // team
        const mappedMembers: Employee[] = (d.members ?? []).map((m: any) => {
          const full =
            (m.user?.firstName ? `${m.user.firstName} ` : "") +
            (m.user?.lastName || "");
          const label = (full.trim() || m.user?.email || "").trim();
          return { id: String(m.usersAID), name: label, email: m.user?.email ?? "" };
        });
        setTeam(mappedMembers);

        // tasks
        const mappedTasks: Task[] = (d.tasks ?? []).map((t: any) => ({
          id: String(t.taskAID),
          name: t.name ?? "",
          subject: t.taskDesc ?? "",
          hours: Number(t.hoursEst ?? 0),
          priority: numToPriority(Number(t.taskPriority)),
        }));
        setTasks(mappedTasks);
        setOrigTasks(Object.fromEntries(mappedTasks.map((t) => [t.id, t])));
      } catch (e: any) {
        showToast(e?.message || "Failed to load project", "error");
      }
    })();
    return () => {};
  }, [projectId]);

  /* === load users for assign/leader === */
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const res = await getAssignUsers({
          search: deferredQuery || undefined,
          onlyActive: true,
          limit: 50,
          offset: 0,
        });
        if (cancelled) return;

        const rows: Employee[] = res.items.map((u: AssignUser) => ({
          id: String(u.id),
          name: ((u as any).fullName || (u as any).label || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email) as string,
          email: u.email,
        }));
        setEmployees(rows);
        setLeadersPool(rows);
        setLoadedOnce(true);

        if (rows.length && (leaderId == null || !rows.find(r => Number(r.id) === leaderId))) {
          setLeader(`${rows[0].name}::${rows[0].id}`);
          setLeaderId(Number(rows[0].id));
        } else if (leaderId != null) {
          const me = rows.find(r => Number(r.id) === leaderId);
          if (me) setLeader(`${me.name}::${me.id}`);
        }
      } catch {
        setEmployees([]); setLeadersPool([]); setLoadedOnce(true);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }, 200);

    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQuery, leaderId]);

  /* === filters & helpers === */
  const filtered = useMemo(
    () =>
      employees.filter(
        (e) =>
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          e.email.toLowerCase().includes(query.toLowerCase())
      ),
    [query, employees]
  );

  const addToTeam = (emp: Employee) =>
    setTeam((cur) => (cur.find((x) => x.id === emp.id) ? cur : [...cur, emp]));
  const removeFromTeam = (id: string) => setTeam((cur) => cur.filter((x) => x.id !== id));

  // DnD
  const [over, setOver] = useState(false);
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "copy";
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setOver(true);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const found = employees.find((x) => x.id === id);
    if (found) addToTeam(found);
    setOver(false);
  };

  // tasks add/edit/delete (نفس AddProjects)
  const addOrUpdateTask = () => {
    const hrs = Number(draft.hours || 0);
    if (!draft.name.trim() || !draft.subject.trim()) return;
    if (editingId) {
      setTasks((cur) =>
        cur.map((t) =>
          t.id === editingId ? { ...t, name: draft.name.trim(), subject: draft.subject.trim(), hours: hrs, priority: draft.priority } : t
        )
      );
      setEditingId(null);
    } else {
      const id = `tmp-${crypto.randomUUID()}`;
      setTasks((cur) => [...cur, { id, name: draft.name.trim(), subject: draft.subject.trim(), hours: hrs, priority: draft.priority }]);
    }
    setDraft({ name: "", subject: "", hours: "", priority: "High" });
  };
  const editTask = (t: Task) => {
    setEditingId(t.id);
    setDraft({ name: t.name, subject: t.subject, hours: String(t.hours), priority: t.priority });
  };
  const deleteTaskLocal = (id: string) => setTasks((cur) => cur.filter((t) => t.id !== id));

  // leader change
  const handleLeaderChange = (v: string) => {
    const parts = v.split("::");
    if (parts.length === 2) {
      setLeader(v);
      setLeaderId(Number(parts[1]) || null);
    } else {
      setLeader(v);
      const hit = leadersPool.find((x) => x.name === v);
      setLeaderId(hit ? Number(hit.id) : null);
    }
  };

  // حفظ التعديلات
  const [submitting, setSubmitting] = useState(false);
  const saveAll = async () => {
    if (submitting) return;
    try {
      if (!title.trim()) return showToast("Please enter project title.", "error");
      if (!leaderId) return showToast("Please select a project leader.", "error");
      if (team.length === 0) return showToast("Please add at least one team member.", "error");

      setSubmitting(true);

      // budget parsing
      const budgetNum =
        Number((budget || "").replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;

      const memberIds = team.map((m) => Number(m.id)).filter((n) => !Number.isNaN(n));
      if (!memberIds.includes(leaderId)) memberIds.push(leaderId);

      // 1) Update project master
      await updateProject(projectId, {
        name: title.trim(),
        projectDesc: desc || undefined,
        leaderAID: leaderId ?? undefined,
        type,
        startDate: start || undefined,
        dueDate: due || undefined,
        budget: budgetNum,
        status,
        members: memberIds,
      });

      // 2) Diff tasks
      const origIds = new Set(Object.keys(origTasks));
      const nowIds = new Set(tasks.map((t) => t.id));

      // a) deleted
      const deleted = [...origIds].filter((id) => !nowIds.has(id) && !id.startsWith("tmp-"));
      for (const id of deleted) {
        await deleteTask(projectId, Number(id));
      }

      // b) added
      const added = tasks.filter((t) => t.id.startsWith("tmp-"));
      for (const t of added) {
        const dto: CreateTaskInput = {
          title: t.name,
          subject: t.subject,
          estimatedHours: t.hours,
          priority: t.priority,
        };
        await createTask(projectId, dto);
      }

      // c) updated
      const mayBeEdited = tasks.filter((t) => origIds.has(t.id));
      for (const t of mayBeEdited) {
        const o = origTasks[t.id];
        const changed =
          t.name !== o.name ||
          t.subject !== o.subject ||
          t.hours !== o.hours ||
          t.priority !== o.priority;
        if (changed) {
          const dto: UpdateTaskInput = {
            title: t.name,
            subject: t.subject,
            estimatedHours: t.hours,
            priority: t.priority,
          };
          await updateTask(projectId, Number(t.id), dto);
        }
      }

      showToast("Project updated successfully ✅", "success", 1200);
      setTimeout(() => navigate("/admin/projects"), 900);
    } catch (err: any) {
      showToast(err?.message || "Failed to save project", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const nextDisabled =
    (step === 1 && !title.trim()) ||
    (step === 2 && team.length === 0);

  return (
    <div className="min-h-[calc(100dvh-120px)] w-full px-4 py-6">
      {/* Toast */}
      {toast.open && (
        <div
          className={cn(
            "fixed left-1/2 top-5 z-[60] -translate-x-1/2 transform rounded-xl border px-4 py-3 shadow-lg backdrop-blur",
            "animate-in fade-in zoom-in-95 duration-200",
            toast.kind === "success" && "border-emerald-200 bg-emerald-50/90 text-emerald-800",
            toast.kind === "error" && "border-red-200 bg-red-50/90 text-red-800",
            toast.kind === "info" && "border-slate-200 bg-white/90 text-slate-800"
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              className="ml-2 rounded px-2 text-xs text-slate-500 hover:bg-slate-100"
              onClick={() => setToast((t) => ({ ...t, open: false }))}
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="mb-5 flex w-full items-center gap-4 px-4">
        <Step num={1} label="Project Details" active={step === 1} done={step > 1} />
        <Connector />
        <Step num={2} label="Assign Team" active={step === 2} done={step > 2} />
        <Connector />
        <Step num={3} label="Project Tasks" active={step === 3} />
      </div>

      <Card className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6 md:p-7">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div className="mb-5">
                <Label htmlFor="title" className="mb-2 block text-slate-700">Project Title</Label>
                <Input id="title" placeholder="Project title" className="h-11 rounded-lg bg-slate-50" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="mb-5 grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-slate-700">Project Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-11 w-full rounded-lg bg-slate-50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="w-[--radix-select-trigger-width]">
                      {ALL_PROJECT_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-slate-700">Project Leader</Label>
                  <Select value={leader} onValueChange={handleLeaderChange}>
                    <SelectTrigger className="h-11 w-full rounded-lg bg-slate-50">
                      <SelectValue placeholder="Select leader" />
                    </SelectTrigger>
                    <SelectContent className="w-[--radix-select-trigger-width]">
                      {leadersPool.length > 0 ? (
                        leadersPool.map((l) => (
                          <SelectItem key={l.id} value={`${l.name}::${l.id}`}>{l.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__none" disabled>
                          {loadingUsers || !loadedOnce ? "Loading…" : "No users found"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-5">
                <Label htmlFor="desc" className="mb-2 block text-slate-700">Project Description</Label>
                <Textarea id="desc" placeholder="Description" className="min-h-[120px] resize-y rounded-lg bg-slate-50" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <FieldDate id="start" label="Start Date" value={start} onChange={setStart} />
                <FieldDate id="due" label="Due Date" value={due} onChange={setDue} />
                <div>
                  <Label htmlFor="budget" className="mb-2 block text-slate-700">Project Budget</Label>
                  <Input id="budget" placeholder="$0.00" className="h-11 rounded-lg bg-slate-50" value={budget} onChange={(e) => setBudget(e.target.value)} />
                </div>
              </div>

              <div className="mb-2">
                <Label className="mb-2 block text-slate-700">Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="h-11 w-full rounded-lg bg-slate-50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="w-[--radix-select-trigger-width]">
                    <SelectItem value="On Track">On Track</SelectItem>
                    <SelectItem value="Offtrack">Offtrack</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* STEP 2 – Assign team (نفس AddProjects) */}
          {step === 2 && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Assign Team Members</h2>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Left: employees list */}
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-700">Company Employees</div>
                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Search employees" className="h-10 rounded-lg bg-slate-50 pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
                  </div>

                  <ul className="space-y-3">
                    {filtered.map((e) => (
                      <li key={e.id}>
                        <button
                          draggable
                          onDragStart={(ev) => onDragStart(ev, e.id)}
                          onClick={() => addToTeam(e)}
                          className={cn("flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition","hover:bg-slate-50")}
                          title="Drag to the right panel or click to add"
                        >
                          <Avatar className="h-9 w-9">
                            {e.avatar ? <AvatarImage src={e.avatar} alt={e.name} /> : <AvatarFallback>{e.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>}
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-[14px] font-medium text-slate-800">{e.name}</div>
                            <div className="truncate text-[12px] text-slate-500">{e.email}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                    {loadingUsers && <li className="text-center text-xs text-slate-400">Loading…</li>}
                    {!loadingUsers && loadedOnce && filtered.length === 0 && <li className="text-center text-xs text-slate-400">No users found</li>}
                  </ul>
                </div>

                {/* Right: selected list */}
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-700">Project Team Members ({team.length})</div>

                  <div onDragOver={onDragOver} onDragLeave={() => setOver(false)} onDrop={onDrop}
                    className={cn("min-h-[340px] rounded-xl border p-3", over ? "border-blue-400 bg-blue-50/40" : "border-slate-300 bg-slate-50")}
                  >
                    {team.length === 0 && (
                      <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-slate-500">Drag and drop employees here</div>
                    )}

                    <ul className="space-y-2">
                      {team.map((m) => (
                        <li key={m.id} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-2.5 shadow-[0_1px_0_rgba(16,185,129,0.05)]">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {m.avatar ? <AvatarImage src={m.avatar} alt={m.name} /> : <AvatarFallback>{m.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>}
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate text-[14px] font-medium text-slate-800">{m.name}</div>
                              <div className="truncate text-[12px] text-slate-500">{m.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">ADDED</Badge>
                            <button className="inline-flex h-8 items-center justify-center rounded-md px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              onClick={() => removeFromTeam(m.id)} aria-label="Remove" title="Remove">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {team.length > 0 && (
                      <div className="mt-3 text-center text-sm text-slate-500">Drag and drop more employees here</div>
                    )}
                  </div>
                </div>
              </div>

              <hr className="my-6 border-slate-200" />
            </>
          )}

          {/* STEP 3 – Tasks */}
          {step === 3 && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Edit Project Tasks</h2>

              {/* add row */}
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1.2fr_160px_140px_40px]">
                <div>
                  <Label className="mb-1 block text-slate-700">Task Name</Label>
                  <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g., Design Landing Page" className="h-10 rounded-lg bg-slate-50" />
                </div>
                <div>
                  <Label className="mb-1 block text-slate-700">Subject / Details</Label>
                  <Input value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} placeholder="e.g., Create wireframes and mockups" className="h-10 rounded-lg bg-slate-50" />
                </div>
                <div>
                  <Label className="mb-1 block text-slate-700">Estimated Hours</Label>
                  <Input type="number" value={draft.hours} onChange={(e) => setDraft((d) => ({ ...d, hours: e.target.value }))} placeholder="e.g., 20" className="h-10 rounded-lg bg-slate-50" />
                </div>
                <div>
                  <Label className="mb-1 block text-slate-700">Priority</Label>
                  <Select value={draft.priority} onValueChange={(v: Priority) => setDraft((d) => ({ ...d, priority: v }))}>
                    <SelectTrigger className="h-10 w-full rounded-lg bg-slate-50">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="w-[--radix-select-trigger-width]">
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={addOrUpdateTask} className="h-10 w-full rounded-lg" aria-label={editingId ? "Update task" : "Add task"} title={editingId ? "Update task" : "Add task"}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* list */}
              <div className="space-y-3">
                {tasks.map((t) => (
                  <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-slate-800">{t.name}</div>
                        <div className="mt-1 text-[13.5px] text-slate-600">{t.subject}</div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-slate-800" onClick={() => editTask(t)} aria-label="Edit" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-red-600" onClick={() => deleteTaskLocal(t.id)} aria-label="Delete" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        {t.hours} Hours
                      </span>
                      <PriorityBadge p={t.priority} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer actions */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)}
              className="text-slate-600 hover:text-slate-800"
            >
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => navigate("/admin/projects")}>
                Cancel
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={() => setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3)} disabled={nextDisabled}>
                  Next
                </Button>
              ) : (
                <Button type="button" className="px-6" onClick={saveAll} disabled={submitting}>
                  {submitting ? "Saving…" : "Save Changes"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ====== Sub components (نفس AddProjects) ====== */
function Step({ num, label, active = false, done = false }: { num: number; label: string; active?: boolean; done?: boolean; }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
        active || done ? "border-[#1f4ed8] bg-[#1f4ed8] text-white" : "border-slate-300 bg-slate-200 text-slate-500")}>
        {done ? <Check className="h-4 w-4" /> : num}
      </div>
      <div className={cn("text-sm font-medium", active ? "text-[#1f4ed8]" : "text-slate-400")}>
        {label}
        {active && <div className="mt-1 h-[2px] w-full rounded bg-[#1f4ed8]" />}
      </div>
    </div>
  );
}
function Connector() { return <div className="h-[2px] flex-1 rounded bg-slate-200" />; }
function FieldDate({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void; }) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block text-slate-700">{label}</Label>
      <Input id={id} type="date" placeholder="mm/dd/yyyy" className="h-11 rounded-lg bg-slate-50" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function PriorityBadge({ p }: { p: Priority }) {
  if (p === "High")
    return <Badge className="rounded-full bg-red-100 px-2 py-0.5 text-[12px] font-semibold text-red-700">High</Badge>;
  if (p === "Medium")
    return <Badge className="rounded-full bg-amber-100 px-2 py-0.5 text-[12px] font-semibold text-amber-700">Medium</Badge>;
  return <Badge className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-700">Low</Badge>;
}
