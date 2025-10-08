// src/lib/auth.ts
export type AuthUser = { id: string; name: string; role?: string; avatarUrl?: string };
export type AuthState = { user: AuthUser; token: string };

export const AUTH_KEY = "ok_auth";

// حفظ موحّد + بث حدث لتحديث كل الـUIs
export function saveAuth(auth: AuthState) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event("ok-auth-change"));
}

// تنظيف شامل لكل مفاتيح الأوث + بث الحدث
export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);      // الحالة الموحّدة
    localStorage.removeItem("authToken");   // المفاتيح اللي بتستخدمها صفحاتك
    localStorage.removeItem("authUser");
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
  } catch {}
  window.dispatchEvent(new Event("ok-auth-change"));
}

// اختياري: helper للقراءة الموحّدة
export function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}
