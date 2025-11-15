"use client";

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
  SidebarTrigger,
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
  ChevronDown,
  LogOut,
  UserPlus,
  Plus,
  BarChart2,
  FileText,
  Mail,                // ⬅️ (A1) NEW: icon for Contacts
} from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useMemo, useState } from "react";
import { clearAuth, AUTH_KEY, getStoredRole, type AuthRole } from "@/lib/auth";

type Me = {
  id: number;
  email: string;
  role: AuthRole;
  firstName?: string;
  lastName?: string;
};

function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null);

  const readMeFromStorage = () => {
    try {
      const parse = (key: string) => {
        const value = localStorage.getItem(key);
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      };

      const authUser = parse("authUser");
      const auth = parse("auth");
      const legacyUser = parse("user");
      const okAuth = parse(AUTH_KEY);

      const candidate =
        authUser ??
        (auth && typeof auth === "object" ? (auth as any).user : null) ??
        legacyUser ??
        (okAuth && typeof okAuth === "object" ? (okAuth as any).user : null);

      if (candidate?.id) {
        return {
          id: Number(candidate.id),
          email: String(candidate.email || ""),
          firstName: candidate.firstName || undefined,
          lastName: candidate.lastName || undefined,
          role: getStoredRole(), // ← الدور المؤكد
        } satisfies Me;
      }
    } catch {/* ignore */}
    return null;
  };

  useEffect(() => {
    setMe(readMeFromStorage());
    const onChange = (e: StorageEvent | Event) => {
      if (e instanceof StorageEvent) {
        if (["authUser", "authToken", "auth", "user", AUTH_KEY].includes(e.key ?? "")) {
          setMe(readMeFromStorage());
        }
      } else {
        setMe(readMeFromStorage());
      }
    };
    window.addEventListener("storage", onChange as any);
    window.addEventListener("ok-auth-change", onChange as any);
    return () => {
      window.removeEventListener("storage", onChange as any);
      window.removeEventListener("ok-auth-change", onChange as any);
    };
  }, []);

  return me;
}

export function AppSidebar() {
  const navigate = useNavigate();
  const me = useMe();

  // 🔴 المهم: الدور يُقرأ من getStoredRole() (مع fallback على JWT)
  const role: AuthRole = getStoredRole();
  const isAdmin = role === "admin";

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
    settings: false,
    blogs: false,
  });

  const handleLogout = () => {
    clearAuth();
    navigate("/admin/login", { replace: true });
  };

  return (
    <Sidebar
      collapsible="icon"
      className="group border-r bg-white"
      style={{ ["--sidebar-width" as any]: "260px" }}
    >
      {/* Header */}
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <NavLink
            to="/admin/dashboard"
            className="flex min-w-0 items-start gap-2 group-data-[collapsible=icon]:hidden"
          >
            <div className="min-w-0 text-left">
              <div className="truncate font-bold tracking-tight">OneKlient</div>
              <div className="text-xs opacity-70">Dashboard</div>
            </div>
          </NavLink>

          <SidebarTrigger
            aria-label="Toggle sidebar"
            className="
              h-10 w-10 p-0 rounded-full border bg-white shadow-sm hover:bg-gray-50 transition
              group-data-[collapsible=icon]:mx-auto
            "
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="px-2 text-xs opacity-70 group-data-[collapsible=icon]:hidden">
            Platform
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-2 pt-1">
              {/* Projects (admin only) */}
              {isAdmin && (
                <SidebarMenuItem>
                  <Collapsible
                    open={open.projects}
                    onOpenChange={(v) => setOpen((o) => ({ ...o, projects: v }))}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="h-10 rounded-xl hover:bg-gray-100/70 data-[state=open]:bg-gray-100/90 flex items-center justify-between group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center">
                        <span className="flex items-center gap-2">
                          <LayoutGrid className="size-5" />
                          <span className="text-[14px] group-data-[collapsible=icon]:hidden">Projects</span>
                        </span>
                        <ChevronDown className={`size-4 transition-transform ${open.projects ? "rotate-180" : ""} group-data-[collapsible=icon]:hidden`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu className="mt-1 border-l pl-5 group-data-[collapsible=icon]:hidden">
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild className="h-9 rounded-lg text-sm hover:bg-gray-100/60">
                            <NavLink to="/admin/projects">
                              <LayoutGrid className="size-4" />
                              <span className="text-[13px]">All Projects</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild className="h-9 rounded-lg text-sm hover:bg-gray-100/60">
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
              )}

              {/* Users (admin only) */}
              {isAdmin && (
                <SidebarMenuItem>
                  <Collapsible
                    open={open.users}
                    onOpenChange={(v) => setOpen((o) => ({ ...o, users: v }))}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="h-10 rounded-xl hover:bg-gray-100/70 data-[state=open]:bg-gray-100/90 flex items-center justify-between group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center">
                        <span className="flex items-center gap-2">
                          <UsersIcon className="size-5" />
                          <span className="text-[14px] group-data-[collapsible=icon]:hidden">Users</span>
                        </span>
                        <ChevronDown className={`size-4 transition-transform ${open.users ? "rotate-180" : ""} group-data-[collapsible=icon]:hidden`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu className="mt-1 border-l pl-5 group-data-[collapsible=icon]:hidden">
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild className="h-9 rounded-lg text-sm hover:bg-gray-100/60">
                            <NavLink to="/admin/users">
                              <UsersIcon className="size-4" />
                              <span className="text-[13px]">All Users</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild className="h-9 rounded-lg text-sm hover:bg-gray-100/60">
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
              )}

              {/* Timer */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.timer}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, timer: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="h-10 rounded-xl hover:bg-gray-100/70 data-[state=open]:bg-gray-100/90 flex items-center justify-between group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center">
                      <span className="flex items-center gap-2">
                        <TimerIcon className="size-5" />
                        <span className="text-[14px] group-data-[collapsible=icon]:hidden">Timer</span>
                      </span>
                      <ChevronDown className={`size-4 transition-transform ${open.timer ? "rotate-180" : ""} group-data-[collapsible=icon]:hidden`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5 group-data-[collapsible=icon]:hidden">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild className="h-9 rounded-lg text-sm hover:bg-gray-100/60">
                          <NavLink to="/admin/timer/my">
                            <TimerIcon className="size-4" />
                            <span className="text-[13px]">Timer</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {isAdmin && (
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild className="h-9 rounded-lg text-sm hover:bg-gray-100/60">
                            <NavLink to="/admin/timer/report">
                              <BarChart2 className="size-4" />
                              <span className="text-[13px]">Report</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Blogs (admin only) */}
              {isAdmin && (
                <SidebarMenuItem>
                  <Collapsible
                    open={open.blogs}
                    onOpenChange={(v) => setOpen((o) => ({ ...o, blogs: v }))}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="h-10 rounded-xl hover:bg-gray-100/70 data-[state=open]:bg-gray-100/90 flex items-center justify-between group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center">
                        <span className="flex items-center gap-2">
                          <FileText className="size-5" />
                          <span className="text-[14px] group-data-[collapsible=icon]:hidden">Blogs</span>
                        </span>
                        <ChevronDown className={`size-4 transition-transform ${open.blogs ? "rotate-180" : ""} group-data-[collapsible=icon]:hidden`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu className="mt-1 border-l pl-5 group-data-[collapsible=icon]:hidden">
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild className="h-9 rounded-lg text-sm hover:bg-gray-100/60">
                            <NavLink to="/admin/blogs">
                              <FileText className="size-4" />
                              <span className="text-[13px]">All Blogs</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild className="h-9 rounded-lg text-sm hover:bg-gray-100/60">
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
              )}

              {/* (A1) NEW: Contacts — placed before Settings */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="h-10 rounded-xl hover:bg-gray-100/70 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
                >
                  <NavLink to="/admin/contacts">
                    <Mail className="size-5" />
                    <span className="text-[14px] group-data-[collapsible=icon]:hidden">Contacts</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Settings */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="h-10 rounded-xl hover:bg-gray-100/70 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
                >
                  <NavLink to="/admin/settings">
                    <SettingsIcon className="size-5" />
                    <span className="text-[14px] group-data-[collapsible=icon]:hidden">Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-auto w-11/12 group-data-[collapsible=icon]:w-8/12" />

      <SidebarFooter className="px-3 pb-4">
        <div className="group-data-[collapsible=icon]:hidden flex items-center justify-between rounded-xl border bg-white px-2 py-2 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0 rounded-full overflow-hidden ring-1 ring-black/10 shadow-sm">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="text-[11px] font-medium">{initials}</AvatarFallback>
            </Avatar>
            <div className="truncate text-[13px] font-semibold leading-none">{displayName}</div>
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

        <div className="hidden group-data-[collapsible=icon]:flex w-full items-center justify-center">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm hover:bg-gray-50 p-0"
            aria-label={displayName}
            title={displayName}
          >
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
