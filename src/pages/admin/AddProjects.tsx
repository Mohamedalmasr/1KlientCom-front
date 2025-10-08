// src/pages/admin/AddProjects.tsx
import { useMemo, useState } from "react";
import {
  Check,
  Search,
  X,
  Plus,
  Edit2,
  Trash2,
  Clock3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* =================== Sample data =================== */
type Employee = { id: string; name: string; email: string; avatar?: string };

const EMPLOYEES: Employee[] = [
  { id: "alex", name: "Alex Johnson", email: "alex.j@example.com" },
  { id: "maria", name: "Maria Garcia", email: "maria.g@example.com" },
  { id: "james", name: "James Smith", email: "james.s@example.com" },
  { id: "emily", name: "Emily Jones", email: "emily.j@example.com" },
  { id: "michael", name: "Michael Brown", email: "michael.b@example.com" },
];

const PROJECT_TYPES = ["Web Development", "Mobile App", "Backend Service", "Data / AI"] as const;
const LEADERS = ["Anima Agrawal", "Omar Hassan", "Mona Ali"] as const;

/* =================== Tasks types =================== */
type Priority = "High" | "Medium" | "Low";
type Task = { id: string; name: string; subject: string; hours: number; priority: Priority };

export default function AddProjects() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // step 1 (details)
  const [type, setType] = useState<string>(PROJECT_TYPES[0]);
  const [leader, setLeader] = useState<string>(LEADERS[0]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState("");
  const [due, setDue] = useState("");
  const [budget, setBudget] = useState("$0.00");

  // step 2 (team)
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState<Employee[]>([]);
  const filtered = useMemo(
    () =>
      EMPLOYEES.filter(
        (e) =>
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          e.email.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const addToTeam = (emp: Employee) =>
    setTeam((cur) => (cur.find((x) => x.id === emp.id) ? cur : [...cur, emp]));
  const removeFromTeam = (id: string) => setTeam((cur) => cur.filter((x) => x.id !== id));

  // DnD
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
    const found = EMPLOYEES.find((x) => x.id === id);
    if (found) addToTeam(found);
    setOver(false);
  };
  const [over, setOver] = useState(false);

  // step 3 (tasks)
  const [tasks, setTasks] = useState<Task[]>([
    // أمثلة أولية عشان تبان زي لقطة الشاشة
    { id: "t1", name: "User Authentication Flow", subject: "Implement login, registration, and password reset functionality.", hours: 16, priority: "High" },
    { id: "t2", name: "Develop API Endpoints", subject: "Create REST APIs for tasks, projects, and users.", hours: 40, priority: "High" },
    { id: "t3", name: "Set Up Database Schema", subject: "Design and create tables for the application data.", hours: 8, priority: "Medium" },
  ]);
  const [draft, setDraft] = useState<{ name: string; subject: string; hours: string; priority: Priority }>({
    name: "",
    subject: "",
    hours: "",
    priority: "High",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

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
      const id = crypto.randomUUID();
      setTasks((cur) => [...cur, { id, name: draft.name.trim(), subject: draft.subject.trim(), hours: hrs, priority: draft.priority }]);
    }
    setDraft({ name: "", subject: "", hours: "", priority: "High" });
  };
  const editTask = (t: Task) => {
    setEditingId(t.id);
    setDraft({ name: t.name, subject: t.subject, hours: String(t.hours), priority: t.priority });
  };
  const deleteTask = (id: string) => setTasks((cur) => cur.filter((t) => t.id !== id));

  const nextDisabled = step === 1 && !title.trim();

  const createProject = () => {
    // TODO: اربط هنا بباك إندك (POST /projects ...)
    // console.log({ title, type, leader, desc, start, due, budget, team, tasks });
    // للآن هنعتبره أنشأ المشروع ونرجع لصفحة المشاريع:
    window.location.assign("/admin/projects");
  };

  return (
    <div className="min-h-[calc(100dvh-120px)] w-full px-4 py-6">
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
          {/* STEP 1 ----------------------------------------------------------- */}
          {step === 1 && (
            <>
              <div className="mb-5">
                <Label htmlFor="title" className="mb-2 block text-slate-700">
                  Project Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., E-commerce Platform Development"
                  className="h-11 rounded-lg bg-slate-50"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mb-5 grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-slate-700">Project Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-11 w-full rounded-lg bg-slate-50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="w-[--radix-select-trigger-width]">
                      {PROJECT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-slate-700">Project Leader</Label>
                  <Select value={leader} onValueChange={setLeader}>
                    <SelectTrigger className="h-11 w-full rounded-lg bg-slate-50">
                      <SelectValue placeholder="Select leader" />
                    </SelectTrigger>
                    <SelectContent className="w-[--radix-select-trigger-width]">
                      {LEADERS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-5">
                <Label htmlFor="desc" className="mb-2 block text-slate-700">
                  Project Description
                </Label>
                <Textarea
                  id="desc"
                  placeholder="Provide a brief description of the project..."
                  className="min-h-[120px] resize-y rounded-lg bg-slate-50"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <FieldDate id="start" label="Start Date" value={start} onChange={setStart} />
                <FieldDate id="due" label="Due Date" value={due} onChange={setDue} />
                <div>
                  <Label htmlFor="budget" className="mb-2 block text-slate-700">
                    Project Budget
                  </Label>
                  <Input
                    id="budget"
                    placeholder="$0.00"
                    className="h-11 rounded-lg bg-slate-50"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* STEP 2 ----------------------------------------------------------- */}
          {step === 2 && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Assign Team Members</h2>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Left: employees list */}
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-700">Company Employees</div>

                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search employees"
                      className="h-10 rounded-lg bg-slate-50 pl-9"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>

                  <ul className="space-y-3">
                    {filtered.map((e) => (
                      <li key={e.id}>
                        <button
                          draggable
                          onDragStart={(ev) => onDragStart(ev, e.id)}
                          onClick={() => addToTeam(e)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition",
                            "hover:bg-slate-50"
                          )}
                          title="Drag to the right panel or click to add"
                        >
                          <Avatar className="h-9 w-9">
                            {e.avatar ? (
                              <AvatarImage src={e.avatar} alt={e.name} />
                            ) : (
                              <AvatarFallback>
                                {e.name
                                  .split(" ")
                                  .map((s) => s[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-[14px] font-medium text-slate-800">{e.name}</div>
                            <div className="truncate text-[12px] text-slate-500">{e.email}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: selected list in a bordered box */}
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-700">
                    Project Team Members ({team.length})
                  </div>

                  <div
                    onDragOver={onDragOver}
                    onDragLeave={() => setOver(false)}
                    onDrop={onDrop}
                    className={cn(
                      "min-h-[340px] rounded-xl border p-3",
                      over ? "border-blue-400 bg-blue-50/40" : "border-slate-300 bg-slate-50"
                    )}
                  >
                    {team.length === 0 && (
                      <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-slate-500">
                        Drag and drop employees here
                      </div>
                    )}

                    <ul className="space-y-2">
                      {team.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-2.5 shadow-[0_1px_0_rgba(16,185,129,0.05)]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {m.avatar ? (
                                <AvatarImage src={m.avatar} alt={m.name} />
                              ) : (
                                <AvatarFallback>
                                  {m.name
                                    .split(" ")
                                    .map((s) => s[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate text-[14px] font-medium text-slate-800">{m.name}</div>
                              <div className="truncate text-[12px] text-slate-500">{m.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              ADDED
                            </Badge>
                            <button
                              className="inline-flex h-8 items-center justify-center rounded-md px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              onClick={() => removeFromTeam(m.id)}
                              aria-label="Remove"
                              title="Remove"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {team.length > 0 && (
                      <div className="mt-3 text-center text-sm text-slate-500">
                        Drag and drop more employees here
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <hr className="my-6 border-slate-200" />
            </>
          )}

          {/* STEP 3 ----------------------------------------------------------- */}
          {step === 3 && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Create Project Tasks</h2>

              {/* add row */}
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1.2fr_160px_140px_40px]">
                <div>
                  <Label className="mb-1 block text-slate-700">Task Name</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="e.g., Design Landing Page"
                    className="h-10 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-slate-700">Subject / Details</Label>
                  <Input
                    value={draft.subject}
                    onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                    placeholder="e.g., Create wireframes and mockups"
                    className="h-10 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-slate-700">Estimated Hours</Label>
                  <Input
                    type="number"
                    value={draft.hours}
                    onChange={(e) => setDraft((d) => ({ ...d, hours: e.target.value }))}
                    placeholder="e.g., 20"
                    className="h-10 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-slate-700">Priority</Label>
                  <Select
                    value={draft.priority}
                    onValueChange={(v: Priority) => setDraft((d) => ({ ...d, priority: v }))}
                  >
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
                  <Button
                    type="button"
                    onClick={addOrUpdateTask}
                    className="h-10 w-full rounded-lg"
                    aria-label={editingId ? "Update task" : "Add task"}
                    title={editingId ? "Update task" : "Add task"}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* list */}
              <div className="space-y-3">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-slate-800">
                          {t.name}
                        </div>
                        <div className="mt-1 text-[13.5px] text-slate-600">
                          {t.subject}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-slate-800"
                          onClick={() => editTask(t)}
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-red-600"
                          onClick={() => deleteTask(t.id)}
                          aria-label="Delete"
                          title="Delete"
                        >
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
              onClick={() => setStep((s) => {
                const next = Math.max(1, s - 1);
                return next as 1 | 2 | 3;
              })}
              className="text-slate-600 hover:text-slate-800"
            >
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="text-red-600 hover:text-red-700">
                Cancel
              </Button>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3)}
                  disabled={nextDisabled}
                >
                  Next
                </Button>
              ) : (
                <Button type="button" className="px-6" onClick={createProject}>
                  Create Project
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =================== small components =================== */

function Step({
  num,
  label,
  active = false,
  done = false,
}: {
  num: number;
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
          active || done
            ? "border-[#1f4ed8] bg-[#1f4ed8] text-white"
            : "border-slate-300 bg-slate-200 text-slate-500"
        )}
      >
        {done ? <Check className="h-4 w-4" /> : num}
      </div>
      <div className={cn("text-sm font-medium", active ? "text-[#1f4ed8]" : "text-slate-400")}>
        {label}
        {active && <div className="mt-1 h-[2px] w-full rounded bg-[#1f4ed8]" />}
      </div>
    </div>
  );
}

function Connector() {
  return <div className="h-[2px] flex-1 rounded bg-slate-200" />;
}

function FieldDate({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block text-slate-700">
        {label}
      </Label>
      <Input
        id={id}
        type="date"
        placeholder="mm/dd/yyyy"
        className="h-11 rounded-lg bg-slate-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PriorityBadge({ p }: { p: Priority }) {
  if (p === "High")
    return (
      <Badge className="rounded-full bg-red-100 px-2 py-0.5 text-[12px] font-semibold text-red-700">
        High
      </Badge>
    );
  if (p === "Medium")
    return (
      <Badge className="rounded-full bg-amber-100 px-2 py-0.5 text-[12px] font-semibold text-amber-700">
        Medium
      </Badge>
    );
  return (
    <Badge className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-700">
      Low
    </Badge>
  );
}
