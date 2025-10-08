// src/pages/admin/Settings.tsx
"use client";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMe, updateMe, changeMyPassword } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

/* ---- helpers: logout everywhere + redirect ---- */
function broadcastLogout() {
  try {
    // هانبعث إيفنت عام لكل التابات/المكونات
    localStorage.setItem("__auth_event__", JSON.stringify({ type: "logout", ts: Date.now() }));
    localStorage.removeItem("__auth_event__");
  } catch {}
}
function clearAuthStorage() {
  localStorage.removeItem("auth");
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  localStorage.removeItem("user");
}
function logoutAndRedirect(navigate: ReturnType<typeof useNavigate>, location: ReturnType<typeof useLocation>) {
  clearAuthStorage();
  broadcastLogout();
  navigate("/admin/login", { replace: true, state: { from: location } });
}

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({ email: "", firstName: "", lastName: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdErr, setPwdErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // لو مافيش توكن أصلاً، روح لوجين فورًا
    try {
      const token =
        localStorage.getItem("authToken") ||
        (JSON.parse(localStorage.getItem("auth") || "null")?.accessToken as string | undefined);
      if (!token) {
        logoutAndRedirect(navigate, location);
        return;
      }
    } catch {
      // لو في مشكلة في الـJSON، نأمن ونخرج
      logoutAndRedirect(navigate, location);
      return;
    }

    (async () => {
      try {
        const data = await getMe();
        if (!mounted) return;
        setForm({
          email: data.email ?? "",
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
        });
      } catch (e: any) {
        // أي 401/403 -> خروج فوري
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          logoutAndRedirect(navigate, location);
          return;
        }
        setErr(e?.message || "Failed to load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // لو حد عمل لوج أوت من مكان تاني (header / sidebar)
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "__auth_event__") {
        try {
          const payload = ev.newValue ? JSON.parse(ev.newValue) : null;
          if (payload?.type === "logout") {
            navigate("/admin/login", { replace: true, state: { from: location } });
          }
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [location, navigate]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    setErr(null);
    try {
      const updated = await updateMe({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });

      // حدّث المفاتيح المحلية عشان السايدبار/الهيدر يشوفوا الاسم الجديد
      try {
        const raw = localStorage.getItem("authUser");
        if (raw) {
          const u = JSON.parse(raw);
          localStorage.setItem("authUser", JSON.stringify({ ...u, ...updated }));
        }
        const authRaw = localStorage.getItem("auth");
        if (authRaw) {
          const a = JSON.parse(authRaw);
          localStorage.setItem("auth", JSON.stringify({ ...a, user: { ...(a?.user || {}), ...updated } }));
        }
        // أبعت إشارة تغيير (لو حابب تسمّع في الهيدر فورًا)
        localStorage.setItem("__auth_event__", JSON.stringify({ type: "profile:update", ts: Date.now() }));
        localStorage.removeItem("__auth_event__");
      } catch {}

      setSaveMsg("Profile updated successfully.");
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        // لو التوكن باظ أثناء الحفظ
        logoutAndRedirect(navigate, location);
        return;
      }
      setErr(e instanceof ApiError ? e.message : "Update failed.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2000);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMsg(null);
    setPwdErr(null);
    try {
      await changeMyPassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: "", newPassword: "" });
      setPwdMsg("Password changed successfully.");
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        logoutAndRedirect(navigate, location);
        return;
      }
      setPwdErr(e instanceof ApiError ? e.message : "Password change failed.");
    } finally {
      setPwdLoading(false);
      setTimeout(() => {
        setPwdMsg(null);
        setPwdErr(null);
      }, 2500);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-center gap-2 rounded-md border bg-card p-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading settings…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Settings</h1>

      {err && (
        <Alert className="mb-4 border-[#FECACA] bg-[#FEF2F2] text-[#7F1D1D]">
          <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Something went wrong
          </AlertTitle>
          <AlertDescription className="text-sm">{err}</AlertDescription>
        </Alert>
      )}

      {/* Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your account information.</CardDescription>
        </CardHeader>
        <CardContent>
          {saveMsg && (
            <Alert className="mb-4 border-[#BBF7D0] bg-[#ECFDF5] text-[#065F46]">
              <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Success
              </AlertTitle>
              <AlertDescription className="text-sm">{saveMsg}</AlertDescription>
            </Alert>
          )}
          <form className="grid gap-4" onSubmit={handleProfileSave}>
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="John"
                autoComplete="given-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Doe"
                autoComplete="family-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <CardFooter className="px-0">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          {pwdMsg && (
            <Alert className="mb-4 border-[#BBF7D0] bg-[#ECFDF5] text-[#065F46]">
              <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Success
              </AlertTitle>
              <AlertDescription className="text-sm">{pwdMsg}</AlertDescription>
            </Alert>
          )}
          {pwdErr && (
            <Alert className="mb-4 border-[#FECACA] bg-[#FEF2F2] text-[#7F1D1D]">
              <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Error
              </AlertTitle>
              <AlertDescription className="text-sm">{pwdErr}</AlertDescription>
            </Alert>
          )}
          <form className="grid gap-4" onSubmit={handlePasswordChange}>
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={pwd.currentPassword}
                onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="At least 6 characters"
                value={pwd.newPassword}
                onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <CardFooter className="px-0">
              <Button type="submit" disabled={pwdLoading}>
                {pwdLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing…
                  </>
                ) : (
                  "Change password"
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
