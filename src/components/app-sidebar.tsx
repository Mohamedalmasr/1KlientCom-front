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
} from "@/components/ui/sidebar";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Users, Timer, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const items = [
  { title: "Projects", to: "/admin/dashboard", icon: LayoutGrid },
  { title: "Users", to: "/admin/users", icon: Users },
  { title: "Timer", to: "/admin/timer", icon: Timer },
  { title: "Settings", to: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // امسح التوكن وروّح لصفحة اللوجين
    localStorage.removeItem("authToken");
    navigate("/admin/login", { replace: true });
  };

  return (
    <Sidebar
      className="border-r bg-white"
      style={{ ["--sidebar-width" as any]: "260px" }}
    >
      {/* العنوان */}
      <SidebarHeader className="px-4 py-4">
        <NavLink
          to="/admin/dashboard"
          className="font-semibold text-lg tracking-tight text-blue-600"
        >
          OneKlient
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="
                        h-9 rounded-xl
                        data-[active=true]:bg-blue-50
                        data-[active=true]:text-blue-600
                        hover:bg-blue-50/70
                      "
                    >
                      <NavLink to={item.to}>
                        <Icon className="size-4" />
                        <span className="text-[14px]">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-4" />

      {/* كارت المستخدم أسفل السايدبار */}
      <SidebarFooter className="px-3 pb-4">
        <div className="flex items-center justify-between rounded-xl border bg-white px-2 py-2 shadow-sm">
          {/* الصورة + الاسم */}
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage
                src="https://i.pravatar.cc/72?img=5"
                alt="Anima Agrawal"
              />
              <AvatarFallback>AA</AvatarFallback>
            </Avatar>
            <div className="truncate text-[13px] font-semibold leading-none">
              Anima Agrawal
            </div>
          </div>

          {/* زرار اللوج آوت */}
          <button
            onClick={handleLogout}
            className="
        inline-flex h-9 items-center justify-center gap-1
        rounded-lg border px-2 text-[12px] text-slate-700
        hover:bg-slate-50 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-200
      "
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline"></span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
