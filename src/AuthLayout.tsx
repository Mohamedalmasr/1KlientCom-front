import { Navigate, useLocation } from "react-router-dom";
import { getStoredRole, loadAuth, type AuthRole } from "@/lib/auth";
import AdminLayout from "./pages/admin/Layout";

function isAuthed() {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("authToken")) return true;
  const snapshot = loadAuth();
  return !!snapshot?.token;
}

const ROLE_DEFAULT_PATH: Record<AuthRole, string> = {
  admin: "/admin/dashboard",
  member: "/admin/dashboard",
};

const MEMBER_ALLOWED = new Set<string>([
  "/admin/dashboard",
  "/admin/tasks",
  "/admin/timer",
  "/admin/timer/my",
  "/admin/settings",
]);

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function isAllowedPath(pathname: string, role: AuthRole): boolean {
  if (role === "admin") return true;
  const normalized = normalizePath(pathname);
  return MEMBER_ALLOWED.has(normalized);
}

export default function AuthLayout() {
  const location = useLocation();

  const authed = isAuthed();

  if (!authed) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  const role = getStoredRole();
  const defaultPath = ROLE_DEFAULT_PATH[role] ?? "/admin/dashboard";

  if (location.pathname === "/admin") {
    return <Navigate to={defaultPath} replace />;
  }

  if (!isAllowedPath(location.pathname, role)) {
    return <Navigate to={defaultPath} replace />;
  }

  return (
    <div className="auth-layout">
      <AdminLayout />
    </div>
  );
}
