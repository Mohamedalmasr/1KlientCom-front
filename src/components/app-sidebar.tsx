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
  ChevronRight,
  LogOut,
  UserPlus,
  Plus,
  BarChart2,
} from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

export function AppSidebar() {
  const navigate = useNavigate();

  const [open, setOpen] = useState({
    projects: false,
    users: false,
    timer: false,
    tasks: false,
    settings: false, // 👈 جديد: عشان Dropdown بتاع Settings
  });

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/admin/login", { replace: true });
  };

  return (
    <Sidebar
      className="border-r bg-white"
      style={{ ["--sidebar-width" as any]: "260px" }}
    >
      {/* Header — عنوان ثابت محاذي للشمال وبولد */}
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
          <SidebarGroupLabel className="px-2 text-xs opacity-70">
            Platform
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {/* Projects — Collapsible (All / Add) */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.projects}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, projects: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="h-9 rounded-xl hover:bg-gray-100/60 data-[state=open]:bg-gray-100/80 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutGrid className="size-4" />
                        <span className="text-[14px]">Projects</span>
                      </span>
                      <ChevronDown
                        className={`size-4 transition-transform ${open.projects ? "rotate-180" : ""}`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5">
                      {/* All Projects */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg text-sm hover:bg-gray-100/60"
                        >
                          <NavLink to="/admin/projects">
                            <LayoutGrid className="size-4" />
                            <span className="text-[13px]">All Projects</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* Add Projects */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg text-sm hover:bg-gray-100/60"
                        >
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

              {/* Users — Collapsible (All / Add) */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.users}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, users: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="h-9 rounded-xl hover:bg-gray-100/60 data-[state=open]:bg-gray-100/80 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <UsersIcon className="size-4" />
                        <span className="text-[14px]">Users</span>
                      </span>
                      <ChevronDown
                        className={`size-4 transition-transform ${open.users ? "rotate-180" : ""}`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5">
                      {/* All Users */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg text-sm hover:bg-gray-100/60"
                        >
                          <NavLink to="/admin/users">
                            <UsersIcon className="size-4" />
                            <span className="text-[13px]">All Users</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* Add User */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg text-sm hover:bg-gray-100/60"
                        >
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

              {/* Timer — Collapsible (Timer / Report) — شِلنا My Timer */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.timer}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, timer: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="h-9 rounded-xl hover:bg-gray-100/60 data-[state=open]:bg-gray-100/80 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <TimerIcon className="size-4" />
                        <span className="text-[14px]">Timer</span>
                      </span>
                      <ChevronDown
                        className={`size-4 transition-transform ${open.timer ? "rotate-180" : ""}`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5">
                      {/* Timer */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg text-sm hover:bg-gray-100/60"
                        >
                          <NavLink to="/admin/timer">
                            <TimerIcon className="size-4" />
                            <span className="text-[13px]">Timer</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* Report */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg text-sm hover:bg-gray-100/60"
                        >
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

              {/* Tasks — Collapsible (Tasks / Add Tasks) */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.tasks}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, tasks: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="h-9 rounded-xl hover:bg-gray-100/60 data-[state=open]:bg-gray-100/80 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <ListTodo className="size-4" />
                        <span className="text-[14px]">Tasks</span>
                      </span>
                      <ChevronDown
                        className={`size-4 transition-transform ${open.tasks ? "rotate-180" : ""}`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5">
                      {/* Tasks */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg text-sm hover:bg-gray-100/60"
                        >
                          <NavLink to="/admin/tasks">
                            <ListTodo className="size-4" />
                            <span className="text-[13px]">Tasks</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* Add Tasks */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg text-sm hover:bg-gray-100/60"
                        >
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

              {/* Settings — Collapsible (Settings / All Settings) */}
              <SidebarMenuItem>
                <Collapsible
                  open={open.settings}
                  onOpenChange={(v) => setOpen((o) => ({ ...o, settings: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="h-9 rounded-xl hover:bg-gray-100/60 data-[state=open]:bg-gray-100/80 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <SettingsIcon className="size-4" />
                        <span className="text-[14px]">Settings</span>
                      </span>
                      <ChevronDown
                        className={`size-4 transition-transform ${open.settings ? "rotate-180" : ""}`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 border-l pl-5">
                      {/* Settings */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg text-sm hover:bg-gray-100/60"
                        >
                          <NavLink to="/admin/settings">
                            <SettingsIcon className="size-4" />
                            <span className="text-[13px]">Settings</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {/* All Settings */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="h-8 rounded-lg text-sm hover:bg-gray-100/60"
                        >
                          <NavLink to="/admin/settings/all">
                            <SettingsIcon className="size-4" />
                            <span className="text-[13px]">All Settings</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-4" />

      {/* User card أسفل السايدبار */}
      <SidebarFooter className="px-3 pb-4">
        <div className="flex items-center justify-between rounded-xl border bg-white px-2 py-2 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src="https://i.pravatar.cc/72?img=5" alt="User" />
              <AvatarFallback>OK</AvatarFallback>
            </Avatar>
            <div className="truncate text-[13px] font-semibold leading-none">
              shadcn user
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="
              inline-flex h-9 items-center justify-center gap-1
              rounded-lg border px-2 text-[12px]
              hover:bg-slate-50 focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-200
            "
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
