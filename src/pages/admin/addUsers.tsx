// src/pages/admin/addUsers.tsx
import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserPlus,
  // MailCheck, // ← (OTP UI) معطّل مؤقتًا
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  ApiError,
  createUser,
  CreateUserPayload,
  // verifyEmailCode, // ← (OTP API) معطّل مؤقتًا
} from "@/lib/api";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------- OTP Imports (Disabled) ----------------
// import {
//   InputOTP,
//   InputOTPGroup,
//   InputOTPSlot,
//   InputOTPSeparator,
// } from "@/components/ui/input-otp";
// --------------------------------------------------------

type CreateForm = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
};

// ---------------- OTP Types (Disabled) ------------------
// type VerifyForm = { otp: string };
// type Step = "create" | "verify";
// const emptyVerify: VerifyForm = { otp: "" };
// --------------------------------------------------------

type State = { loading: boolean; error?: string; success?: string };

const emptyCreate: CreateForm = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
};

export default function AddUsers() {
  // const [step, setStep] = useState<Step>("create"); // ← معطّل
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);
  // const [verifyForm, setVerifyForm] = useState<VerifyForm>(emptyVerify); // ← معطّل
  const [state, setState] = useState<State>({ loading: false });
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // const [createdEmail, setCreatedEmail] = useState<string>(""); // ← معطّل

  const navigate = useNavigate();

  const canSubmitCreate = useMemo(() => {
    if (!createForm.email.trim() || !createForm.password) return false;
    if (createForm.password !== createForm.confirmPassword) return false;
    return true;
  }, [createForm]);

  function onCreateChange<K extends keyof CreateForm>(key: K, val: CreateForm[K]) {
    setCreateForm((f) => ({ ...f, [key]: val }));
  }

  // function onVerifyChange<K extends keyof VerifyForm>(key: K, val: VerifyForm[K]) {
  //   setVerifyForm((f) => ({ ...f, [key]: val }));
  // }

  function onPasswordKeyUp(e: KeyboardEvent<HTMLInputElement>) {
    const caps = (e.getModifierState && e.getModifierState("CapsLock")) || false;
    setCapsLockOn(caps);
  }

  async function onSubmitCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ loading: true });

    const email = createForm.email.trim();
    if (!email) return setState({ loading: false, error: "Email is required." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setState({ loading: false, error: "Please enter a valid email address." });
    if (!createForm.password || createForm.password.length < 6)
      return setState({ loading: false, error: "Password must be at least 6 characters." });
    if (createForm.password !== createForm.confirmPassword)
      return setState({ loading: false, error: "Passwords do not match." });

    // ⚠️ recSts و OTP يتولّاهم السيرفر
    const payload: CreateUserPayload = {
      email,
      password: createForm.password,
      firstName: createForm.firstName || undefined,
      lastName: createForm.lastName || undefined,
    };

    try {
      await createUser(payload);

      // ✅ حالياً: نكمّل الإنشاء فقط بدون خطوة OTP
      setState({ loading: false, success: "User created successfully." });
      setCreateForm(emptyCreate);

      // رجوع لصفحة المستخدمين مباشرة
      setTimeout(() => navigate("/admin/users", { replace: true }), 300);

      // ----------------- فلو OTP (معلّق) -----------------
      // setCreatedEmail(email);
      // setState({
      //   loading: false,
      //   success: "User created. A verification code was sent to the email.",
      // });
      // setStep("verify");
      // setCreateForm(emptyCreate);
      // ---------------------------------------------------
    } catch (err) {
      // لو السيرفر رجّع خطأ إرسال الإيميل، اعتبر العملية نجاح
      const apiErr = err as ApiError;
      const msg = apiErr?.message || "Failed to create user.";

      const treatAsSuccess =
        typeof msg === "string" && /verification email/i.test(msg); // يطابق "Unable to send verification email"

      if (treatAsSuccess) {
        setState({ loading: false, success: "User created successfully." });
        setCreateForm(emptyCreate);
        setTimeout(() => navigate("/admin/users", { replace: true }), 300);
      } else {
        setState({ loading: false, error: msg });
      }
    }
  }

  // function validOtp(code: string) {
  //   return /^\d{6}$/.test(code);
  // }

  // async function onSubmitVerify(e: FormEvent<HTMLFormElement>) {
  //   e.preventDefault();
  //   if (!validOtp(verifyForm.otp)) {
  //     return setState({ loading: false, error: "Code must be 6 digits." });
  //   }
  //   setState({ loading: true });
  //   try {
  //     const res = await verifyEmailCode({ email: createdEmail, code: verifyForm.otp });
  //     if (res.success) {
  //       setState({ loading: false, success: "Email verified successfully." });
  //       setVerifyForm(emptyVerify);
  //       setTimeout(() => navigate("/admin/users", { replace: true }), 400);
  //     } else {
  //       setState({ loading: false, error: res.message || "Invalid code." });
  //     }
  //   } catch (err) {
  //     const message = err instanceof ApiError ? err.message : "Verification failed.";
  //     setState({ loading: false, error: message });
  //   }
  // }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#2563EB]" />
            <CardTitle>Add New User</CardTitle>
          </div>
          <CardDescription>
            Create a new user account for ONEklient Admin.
            {/* بعدها هنفعّل خطوة التحقق بالـ OTP عند إصلاح الباك-إند */}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alerts */}
          {state.error && (
            <Alert className="border-[#FECACA] bg-[#FEF2F2] text-[#7F1D1D]">
              <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Something went wrong
              </AlertTitle>
              <AlertDescription className="text-sm">{state.error}</AlertDescription>
            </Alert>
          )}

          {state.success && (
            <Alert
              className={cn(
                "border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]",
                "flex items-start gap-3"
              )}
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 text-[#10B981]" />
              <div>
                <AlertTitle className="text-sm font-semibold">Success</AlertTitle>
                <AlertDescription className="text-sm">{state.success}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* ===== STEP 1: Create (Active) ===== */}
          <form onSubmit={onSubmitCreate} className="space-y-6" noValidate>
            {/* Names */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={createForm.firstName}
                  onChange={(e) => onCreateChange("firstName", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={createForm.lastName}
                  onChange={(e) => onCreateChange("lastName", e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => onCreateChange("email", e.target.value)}
                  placeholder="user@example.com"
                  autoComplete="email"
                  required
                  className="pl-10 focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) => onCreateChange("password", e.target.value)}
                    onKeyUp={onPasswordKeyUp}
                    placeholder="******"
                    autoComplete="new-password"
                    required
                    className="pl-10 pr-12 focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((p) => !p)}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={createForm.confirmPassword}
                  onChange={(e) => onCreateChange("confirmPassword", e.target.value)}
                  placeholder="******"
                  autoComplete="new-password"
                  required
                  className="focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                />
                {createForm.confirmPassword &&
                  createForm.password !== createForm.confirmPassword && (
                    <p className="text-xs text-red-600">Passwords do not match.</p>
                  )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/users")}
                className="border-slate-200"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={state.loading || !canSubmitCreate}
                className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              >
                {state.loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create user
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* ===== STEP 2: Verify via OTP (Disabled) ===== */}
          {/*
          {step === "verify" && (
            <form onSubmit={onSubmitVerify} className="space-y-6" noValidate>
              <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <MailCheck className="h-4 w-4 text-[#2563EB]" />
                  <p>
                    We sent a 6-digit verification code to{" "}
                    <span className="font-semibold">{createdEmail}</span>. Enter it below to confirm
                    this account.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Verification code</Label>
                <InputOTP value={verifyForm.otp} onChange={(v) => onVerifyChange("otp", v)} maxLength={6}>
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSeparator />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" className="border-slate-200" onClick={() => { setStep("create"); setState({ loading: false }); }}>
                  Back
                </Button>

                <Button type="submit" disabled={state.loading || !validOtp(verifyForm.otp)} className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
                  {state.loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : ("Verify")}
                </Button>
              </div>
            </form>
          )}
          */}
        </CardContent>

        <CardFooter className="flex items-center justify-center gap-2 text-[13px] text-slate-500">
          <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
          <span>Accounts become inactive only after soft delete (recSts = 0). New accounts default to 1.</span>
        </CardFooter>
      </Card>
    </div>
  );
}
