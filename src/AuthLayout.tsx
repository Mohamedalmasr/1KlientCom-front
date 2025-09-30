import {  Navigate, useLocation } from "react-router-dom";
import AdminLayout from "./pages/admin/Layout";

function isAuthed() {
  return !!localStorage.getItem("authToken");
}

export default function AuthLayout() {
  const location = useLocation();

  const authed = isAuthed();
 //const authed = true; // ← كده بنلغي صفحة/شرط الـ login مؤقتًا

  if (!authed) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (location.pathname === "/admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // هنستخدم لياوت الأدمن (اللي فيه السايدبار) زي ما هو
  return (
    <div className="auth-layout">
      <AdminLayout />
    </div>
  );
}
