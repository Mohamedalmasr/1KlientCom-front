// src/pages/auth/Login.tsx
import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { ApiError, login } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { saveAuth } from "@/lib/auth"; // NEW

type LoginFormState = { email: string; password: string };
type LoginState = { loading: boolean; error?: string };

const emptyLoginForm: LoginFormState = { email: "", password: "" };

export default function Login() {
  const [form, setForm] = useState<LoginFormState>(emptyLoginForm);
  const [state, setState] = useState<LoginState>({ loading: false });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // redirect if already signed in
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      const from = (location.state as any)?.from?.pathname as string | undefined;
      const to = from && from.startsWith("/admin") ? from : "/admin/dashboard";
      navigate(to, { replace: true });
    }
  }, [location.state, navigate]);

  const handleChange = (field: keyof LoginFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    const caps =
      (event.getModifierState && event.getModifierState("CapsLock")) || false;
    setCapsLockOn(caps);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState({ loading: true });

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setState({ loading: false, error: "Email and password are required" });
      return;
    }

    try {
      const result = await login({ email, password });

      // keep your existing keys
      localStorage.setItem("authToken", result.accessToken);
      localStorage.setItem("authUser", JSON.stringify(result.user));
      localStorage.setItem("rememberMe", rememberMe ? "1" : "0");

      // unified "auth" object for general reads
      localStorage.setItem(
        "auth",
        JSON.stringify({ accessToken: result.accessToken, user: result.user })
      );

const displayName =
  [result.user.firstName, result.user.lastName].filter(Boolean).join(" ").trim() ||
  result.user.email;

saveAuth({
  token: result.accessToken,
  user: {
    id: String(result.user.id),
    name: displayName,
    // مفيش avatarUrl في الـAPI الحالي — سيبها undefined أو ضيفها لو أضفتها لاحقًا
  },
});
      const from = (location.state as any)?.from?.pathname as string | undefined;
      const to = from && from.startsWith("/admin") ? from : "/admin/dashboard";

      setToastVisible(true);
      setState({ loading: false });
      setForm(emptyLoginForm);

      setTimeout(() => {
        navigate(to, { replace: true });
      }, 200);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Login failed";
      setState({ loading: false, error: message });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F9FF] text-[#0F172A]">
      {/* header */}
      <header className="flex h-16 items-center bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] px-6 text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]">
        <h1 className="text-lg font-semibold tracking-tight">ONEklient Admin</h1>
      </header>

      {/* success toast */}
      <Alert
        variant="default"
        className={cn(
          "pointer-events-none fixed right-6 top-6 z-50 flex w-full max-w-[20rem] items-start gap-3 rounded-xl border bg-[#ECFDF5] p-4 text-[#065F46] shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition-all duration-200",
          toastVisible
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "-translate-y-3 opacity-0"
        )}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="h-5 w-5" />
        <div className="pl-6">
          <AlertTitle className="text-sm font-semibold">
            Signed in successfully
          </AlertTitle>
          <AlertDescription className="mt-1 text-xs">
            Welcome back.
          </AlertDescription>
        </div>
        <button
          type="button"
          className="ml-auto rounded-full p-1 text-[#047857] transition hover:bg-[#bbf7d0]"
          aria-label="Close toast"
          onClick={() => setToastVisible(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>

      {/* content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Access your ONEklient admin dashboard.</CardDescription>
          </CardHeader>

          <CardContent>
            {state.error && (
              <Alert className="border-[#FECACA] bg-[#FEF2F2] text-[#7F1D1D]">
                <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Something went wrong
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {state.error}
                </AlertDescription>
              </Alert>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      autoComplete="username"
                      required
                      className="pl-10 focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      onKeyUp={handlePasswordKeyUp}
                      autoComplete="current-password"
                      required
                      className="pl-10 pr-12 focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                    >
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                  {capsLockOn && (
                    <p className="text-xs text-slate-500" role="status">
                      Caps Lock is on
                    </p>
                  )}
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between text-sm text-slate-600">
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <span className="text-slate-600">Remember me</span>
                </label>

                <a
                  href="#"
                  className="font-medium text-[#2563EB] transition hover:text-[#1d4ed8]"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={state.loading}
                className="w-full bg-[#2563EB] text-white hover:bg-[#1d4ed8] shadow-sm"
              >
                {state.loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>Login</>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 text-[13px] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
              <span>Secure sign in. Use your company account.</span>
            </div>
            <p className="text-center text-xs text-slate-500">
              By signing in you agree to the
              <a
                href="#"
                className="mx-1 font-medium text-[#2563EB] hover:text-[#1d4ed8]"
              >
                Terms
              </a>
              &
              <a
                href="#"
                className="ml-1 font-medium text-[#2563EB] hover:text-[#1d4ed8]"
              >
                Privacy
              </a>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
