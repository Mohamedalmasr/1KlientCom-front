// src/pages/admin/AllProjects.tsx
import { CalendarDays, Pencil, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

const ALL: Project[] = [
  {
    id: 1,
    title: "E-commerce Platform",
    summary:
      "Building a new online marketplace for handmade goods. The project is currently behind schedule due to unexpected integration issues with the payment gateway.",
    status: "offtrack",
    due: "2024-06-15",
    issues: 28,
    members: [{ name: "AM" }, { name: "HS" }, { name: "KT" }],
    canEdit: true,
  },
  {
    id: 2,
    title: "Mobile Banking App",
    summary:
      "Developing a native mobile app for iOS and Android. Key features include fund transfers, bill payments, and biometric authentication. Progress is steady.",
    status: "on-track",
    due: "2024-08-22",
    issues: 8,
    members: [{ name: "AA" }, { name: "MM" }],
    canEdit: true,
  },
  {
    id: 3,
    title: "Cloud Migration",
    summary:
      "Migrating on-premise infrastructure to a public cloud provider. The planning phase is complete, and the execution phase has started smoothly.",
    status: "on-track",
    due: "2024-10-01",
    issues: 3,
    members: [{ name: "MN" }, { name: "AS" }, { name: "RB" }, { name: "TL" }],
  },
  {
    id: 4,
    title: "Website Redesign",
    summary:
      "A full redesign of the corporate website with a modern UI/UX and improved performance. The project was delivered on time and on budget.",
    status: "completed",
    due: "2024-05-01",
    issues: 0,
    members: [{ name: "AM" }, { name: "HS" }, { name: "KT" }],
  },
];

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
      cls: "bg-blue-100 text-blue-700 border border-blue-200",
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

export default function AllProjects() {
  // مفيش Pagination — هنعرِض كل العناصر
  const data = ALL;

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
                    >
                      <Pencil className="h-4 w-4" />
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
      {/* تم حذف الباجينيشن هنا */}
    </div>
  );
}
