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

/** Read token primarily from `authToken`, fallback to legacy `auth` JSON. */
function getAccessToken(): string | null {
  try {
    const token = localStorage.getItem("authToken");
    if (token) return token;

    // legacy shape: localStorage.setItem('auth', JSON.stringify({ accessToken, user }))
    const legacy = localStorage.getItem("auth");
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return parsed?.accessToken ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function authHeaders(): Record<string, string> {
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
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

/* ---------- NEW: self profile/me endpoints (JWT-protected) ------------------- */

export type MeResponse = {
  id: number;
  email: string;
  recSts: number;
  firstName?: string;
  lastName?: string;
  passwordCode?: string;
  passwordCodeDate?: string;
};

/** GET /auth/me — fetch current user (by JWT). */
export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/auth/me", { method: "GET" });
}

/** PATCH /auth/me — update email/firstName/lastName for current user. */
export type UpdateMePayload = Partial<{
  email: string;
  firstName: string;
  lastName: string;
}>;
export async function updateMe(payload: UpdateMePayload): Promise<MeResponse> {
  return request<MeResponse>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** PATCH /auth/me/password — change current user's password. */
export type ChangeMyPasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
export async function changeMyPassword(
  payload: ChangeMyPasswordPayload
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("/auth/me/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/* -------------------- Admin: users list / details / updates ------------------ */

export type GetUsersParams = {
  includeInactive?: boolean;
  q?: string;
  sort?: string; // e.g. "id:desc"
  page?: number;
  limit?: number;
};

export async function getUsers(params?: GetUsersParams): Promise<UserResponse[]> {
  const qs = new URLSearchParams();
  if (params?.includeInactive) qs.set("includeInactive", "1");
  if (params?.q) qs.set("q", params.q);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const path = `/users${qs.toString() ? `?${qs.toString()}` : ""}`;
  return request<UserResponse[]>(path, { method: "GET" });
}

export async function getUser(id: number): Promise<UserResponse> {
  return request<UserResponse>(`/users/${id}`, { method: "GET" });
}

export type UpdateUserPayload = Partial<{
  email: string;
  firstName: string;
  lastName: string;
  recSts: number; // 0/1
}>;

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<UserResponse> {
  return request<UserResponse>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** Admin-only: PATCH /users/:id/password */
export type ChangePasswordPayload = { newPassword: string; currentPassword?: string };
export async function changeUserPassword(
  id: number,
  payload: ChangePasswordPayload
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}/password`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function softDeleteUser(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}`, { method: "DELETE" });
}

export async function restoreUser(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}/restore`, { method: "PATCH" });
}

/* ================================== Contact ================================== */
/**
 * Matches DB table columns:
 * fstname, lstname, phone, email, budget, webdesign, wordpress, seo, marketing, msg
 * (creadt / clientip / recstsd generated by server)
 */
export type ContactPayload = {
  fstname: string;
  lstname: string;
  phone: string;
  email?: string;
  // you can send short codes (preferred) or long values; they will be normalized
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

// map long budget labels to short DB-friendly codes
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

/* ================================== Blogs API ================================= */

export type BlogRow = {
  blogAID: number;
  blogSubj: string;
  blogBody: string;
  creaDt: string; // ISO string
  creaBy: string;
  recSts: "0" | "1";
};

export type CreateBlogPayload = {
  blogSubj: string;
  blogBody: string;
  creaBy?: string; // default "admin"
  recSts?: "0" | "1"; // default "1"
};

export type UpdateBlogPayload = Partial<{
  blogSubj: string;
  blogBody: string;
  recSts: "0" | "1";
}>;

/** GET /blog */
export async function getBlogs(): Promise<BlogRow[]> {
  return request<BlogRow[]>("/blog", { method: "GET" });
}

/** GET /blog/:id */
export async function getBlog(id: number): Promise<BlogRow> {
  return request<BlogRow>(`/blog/${id}`, { method: "GET" });
}

/** POST /blog */
export async function createBlog(payload: CreateBlogPayload): Promise<BlogRow> {
  const body = {
    blogSubj: payload.blogSubj,
    blogBody: payload.blogBody,
    creaBy: payload.creaBy ?? "admin",
    recSts: payload.recSts ?? "1",
  };
  return request<BlogRow>("/blog", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** PATCH /blog/:id */
export async function updateBlog(id: number, payload: UpdateBlogPayload): Promise<BlogRow> {
  return request<BlogRow>(`/blog/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** DELETE /blog/:id */
export async function deleteBlog(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/blog/${id}`, { method: "DELETE" });
}
