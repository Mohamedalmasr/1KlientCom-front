// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

/* ============================ Types (Users / Auth) ============================ */

export type CreateUserPayload = {
  email: string;
  password: string;
  recSts?: number;
  firstName?: string;
  lastName?: string;
  passwordCode?: string;
  passwordCodeDate?: string;
};

export type UserResponse = {
  id: number;
  email: string;
  recSts: number;
  firstName?: string;
  lastName?: string;
  passwordCode?: string;
  passwordCodeDate?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: UserResponse & { passwordCodeDate?: string };
};

export type VerifyCodePayload = {
  email: string;
  code: string;
};

export type VerifyCodeResponse = {
  message: string;
  success: boolean;
  user?: UserResponse;
};

/* ================================ Http Utils ================================ */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message = data?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

/* =========================== Users / Auth Endpoints ========================== */

export async function createUser(payload: CreateUserPayload): Promise<UserResponse> {
  return request<UserResponse>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmailCode(payload: VerifyCodePayload): Promise<VerifyCodeResponse> {
  return request<VerifyCodeResponse>("/users/verify-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ================================= Contact ================================== */
/**
 * مطابق لجدول DB:
 *  fstname, lstname, phone, email, budget, webdesign, wordpress, seo, marketing, msg
 *  (creadt / clientip / recstsd تتولّد من السيرفر)
 */
export type ContactPayload = {
  fstname: string;
  lstname: string;
  phone: string;
  email?: string;
  // بإمكانك إرسال الأكواد القصيرة مباشرة (المفضّل) أو القيم الطويلة وسيتم تحويلها
  budget?:
    | "U2K"
    | "2-5K"
    | "5-10"
    | "10+"
    | "under-2k"
    | "2k-5k"
    | "5k-10k"
    | "10k-plus";
  webdesign?: boolean;
  wordpress?: boolean;
  seo?: boolean;
  marketing?: boolean;
  msg?: string;
};

export type ContactResponse<T = any> = {
  ok: boolean;
  data: T;
};

// تحويل القيم الطويلة للـ budget إلى أكواد قصيرة تناسب طول العمود (varchar(5))
const BUDGET_MAP: Record<string, "U2K" | "2-5K" | "5-10" | "10+"> = {
  "under-2k": "U2K",
  "2k-5k": "2-5K",
  "5k-10k": "5-10",
  "10k-plus": "10+",
};

function normalizeContactPayload(p: ContactPayload): ContactPayload {
  let budget = p.budget;
  if (budget && budget in BUDGET_MAP) {
    budget = BUDGET_MAP[budget as keyof typeof BUDGET_MAP];
  }
  return { ...p, budget };
}

/** POST /contact */
export async function sendContact(payload: ContactPayload): Promise<ContactResponse> {
  return request<ContactResponse>("/contact", {
    method: "POST",
    body: JSON.stringify(normalizeContactPayload(payload)),
  });
}

/* ================================ Exports End ================================ */
