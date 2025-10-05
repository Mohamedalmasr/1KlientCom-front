// src/components/app-sidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Users as UsersIcon,
  Timer as TimerIcon,
  Settings as SettingsIcon,
  ListTodo,
  ChevronDown,
  LogOut,
  UserPlus,
  Plus,
  BarChart2,
  FileText,
} from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useMemo, useState } from "react";

type Me = { id: number; email: string; firstName?: string; lastName?: string };

/** Read logged-in user from localStorage: prefers `authUser`, falls back to legacy keys. */
function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    try {
      // Primary: authUser (saved by login)
      const raw = localStorage.getItem("authUser");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) {
          setMe({
            id: Number(u.id),
            email: String(u.email || ""),
            firstName: u.firstName || undefined,
            lastName: u.lastName || undefined,
          });
          return;
        }
      }

      // Legacy: auth (object with { accessToken, user })
      const authRaw = localStorage.getItem("auth");
      if (authRaw) {
        const auth = JSON.parse(authRaw);
        const u = auth?.user;
        if (u?.id) {
          setMe({
            id: Number(u.id),
            email: String(u.email || ""),
            firstName: u.firstName || undefined,
            lastName: u.lastName || undefined,
          });
          return;
        }
      }

      // Legacy: user
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u?.id) {
          setMe({
            id: Number(u.id),
            email: String(u.email || ""),
            firstName: u.firstName || undefined,
            lastName: u.lastName || undefined,
          });
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setMe(null);
  }, []);

  return me;
}

export function AppSidebar() {
  const navigate = useNavigate();
  const me = useMe();

  const displayName = useMemo(() => {
    if (!me) return "Guest";
    const fn = me.firstName?.trim() || "";
    const ln = me.lastName?.trim() || "";
    const full = `${fn} ${ln}`.trim();
    return full || me.email || "User";
  }, [me]);

  const initials = useMemo(() => {
    if (!me) return "U";
    const fn = (me.firstName ?? "").trim();
    const ln = (me.lastName ?? "").trim();
    const pick = (s: string) => (s ? s[0].toUpperCase() : "");
    const i = `${pick(fn)}${pick(ln)}`.trim() || (me.email?.[0]?.toUpperCase() ?? "U");
    return i.slice(0, 2);
  }, [me]);

  const [open, setOpen] = useState({
    projects: false,
    users: false,
    timer: false,
    tasks: false,
    settings: false,
    blogs: false,
  });

  const handleLogout = () => {
    // clear session-related storage
    localStorage.removeItem("auth");
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("user");
    navigate("/admin/login", { replace: true });
  };

  return (
    <Sidebar className="border-r bg-white" style={{ ["--sidebar-width" as any]: "260px" }}>
      {/* Header */}
      <SidebarHeader className="px-4 py-4">
        <NavLink to="/admin/dashboard" className="flex items-start gap-2">
          <div className="min-w-0 text-left">
            <div className="truncate font-bold tracking-tight">OneKlient</div>
            <div className="text-xs opacity-70">Admin</div>
          </div>
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="px-2 text-xs opacity-70">Platform</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {/* Projects */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.projects}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, projects: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-9 rounded-xl hover:bg-gray-100/60 data-[state=open]:bg-gray-100/80 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <LayoutGrid className="size-4" />
                        <span className="text-[14px]">Projects</span>
                      </span>
                      <ChevronDown className={`size-4 transition-transform ${open.projects ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-8 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/projects">
                            <LayoutGrid className="size-4" />
                            <span className="text-[13px]">All Projects</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-8 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/add/projects">
                            <Plus className="size-4" />
                            <span className="text-[13px]">Add Projects</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Users */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.users}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, users: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-9 rounded-xl hover:bg-gray-100/60 data-[state=open]:bg-gray-100/80 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <UsersIcon className="size-4" />
                        <span className="text-[14px]">Users</span>
                      </span>
                      <ChevronDown className={`size-4 transition-transform ${open.users ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-8 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/users">
                            <UsersIcon className="size-4" />
                            <span className="text-[13px]">All Users</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-8 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/add/users">
                            <UserPlus className="size-4" />
                            <span className="text-[13px]">Add User</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Timer */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.timer}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, timer: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-9 rounded-xl hover:bg-gray-100/60 data-[state=open]:bg-gray-100/80 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <TimerIcon className="size-4" />
                        <span className="text-[14px]">Timer</span>
                      </span>
                      <ChevronDown className={`size-4 transition-transform ${open.timer ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-8 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/timer">
                            <TimerIcon className="size-4" />
                            <span className="text-[13px]">Timer</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-8 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/timer/report">
                            <BarChart2 className="size-4" />
                            <span className="text-[13px]">Report</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Tasks */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.tasks}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, tasks: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-9 rounded-xl hover:bg-gray-100/60 data-[state=open]:bg-gray-100/80 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ListTodo className="size-4" />
                        <span className="text-[14px]">Tasks</span>
                      </span>
                      <ChevronDown className={`size-4 transition-transform ${open.tasks ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-8 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/tasks">
                            <ListTodo className="size-4" />
                            <span className="text-[13px]">Tasks</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-8 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/add/tasks">
                            <Plus className="size-4" />
                            <span className="text-[13px]">Add Tasks</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Blogs */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.blogs}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, blogs: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-9 rounded-xl hover:bg-gray-100/60 data-[state=open]:bg-gray-100/80 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="size-4" />
                        <span className="text-[14px]">Blogs</span>
                      </span>
                      <ChevronDown className={`size-4 transition-transform ${open.blogs ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-8 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/blogs">
                            <FileText className="size-4" />
                            <span className="text-[13px]">All Blogs</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-8 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/add/blog">
                            <Plus className="size-4" />
                            <span className="text-[13px]">Add Blog</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Settings (single page) */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-9 rounded-xl hover:bg-gray-100/60">
                  <NavLink to="/admin/settings">
                    <SettingsIcon className="size-4" />
                    <span className="text-[14px]">Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-4" />

      {/* User card at the bottom */}
      <SidebarFooter className="px-3 pb-4">
        <div className="flex items-center justify-between rounded-xl border bg-white px-2 py-2 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src="" alt="User" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="truncate text-[13px] font-semibold leading-none">
              {displayName}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border px-2 text-[12px] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-200"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
