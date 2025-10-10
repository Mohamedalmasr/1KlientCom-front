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

/** Read token primarily from `authToken`, fallback to `ok_auth` and legacy `auth`. */
function getAccessToken(): string | null {
  try {
    const token = localStorage.getItem("authToken");
    if (token) return token;

    const okAuth = localStorage.getItem("ok_auth");
    if (okAuth) {
      const parsed = JSON.parse(okAuth);
      const t = parsed?.token ?? parsed?.accessToken;
      if (typeof t === "string" && t) return t;
    }

    const legacy = localStorage.getItem("auth");
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return parsed?.accessToken ?? null;
    }
  } catch {}
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
    const message = (data as any)?.message ?? `Request failed with status ${response.status}`;
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

/* ---------- self profile/me endpoints (JWT-protected) ---------- */

export type MeResponse = {
  id: number;
  email: string;
  recSts: number;
  firstName?: string;
  lastName?: string;
  passwordCode?: string;
  passwordCodeDate?: string;
};

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/auth/me", { method: "GET" });
}

export type UpdateMePayload = Partial<{ email: string; firstName: string; lastName: string }>;
export async function updateMe(payload: UpdateMePayload): Promise<MeResponse> {
  return request<MeResponse>("/auth/me", { method: "PATCH", body: JSON.stringify(payload) });
}

export type ChangeMyPasswordPayload = { currentPassword: string; newPassword: string };
export async function changeMyPassword(payload: ChangeMyPasswordPayload): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("/auth/me/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/* -------------------- Admin: users list / details / updates ------------------ */

export type GetUsersParams = {
  includeInactive?: boolean;
  q?: string;
  sort?: string;
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

export type UpdateUserPayload = Partial<{ email: string; firstName: string; lastName: string; recSts: number }>;
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<UserResponse> {
  return request<UserResponse>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export type ChangePasswordPayload = { newPassword: string; currentPassword?: string };
export async function changeUserPassword(id: number, payload: ChangePasswordPayload): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}/password`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function softDeleteUser(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}`, { method: "DELETE" });
}

export async function restoreUser(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}/restore`, { method: "PATCH" });
}

/* ================================== Contact ================================== */

export type ContactPayload = {
  fstname: string;
  lstname: string;
  phone: string;
  email?: string;
  budget?: "U2K" | "2-5K" | "5-10" | "10+" | "under-2k" | "2k-5k" | "5k-10k" | "10k-plus";
  webdesign?: boolean;
  wordpress?: boolean;
  seo?: boolean;
  marketing?: boolean;
  msg?: string;
};

export type ContactResponse<T = any> = { ok: boolean; data: T };

const BUDGET_MAP: Record<string, "U2K" | "2-5K" | "5-10" | "10+"> = {
  "under-2k": "U2K",
  "2k-5k": "2-5K",
  "5k-10k": "5-10",
  "10k-plus": "10+",
};

function normalizeContactPayload(p: ContactPayload): ContactPayload {
  let budget = p.budget;
  if (budget && budget in BUDGET_MAP) budget = BUDGET_MAP[budget as keyof typeof BUDGET_MAP];
  return { ...p, budget };
}

export async function sendContact(payload: ContactPayload): Promise<ContactResponse> {
  return request<ContactResponse>("/contact", { method: "POST", body: JSON.stringify(normalizeContactPayload(payload)) });
}

/* ================================== Blogs API ================================= */

export type BlogRow = {
  blogAID: number;
  blogSubj: string;
  blogBody: string;
  creaDt: string;
  creaBy: string;
  recSts: "0" | "1";
};

export type CreateBlogPayload = { blogSubj: string; blogBody: string; creaBy?: string; recSts?: "0" | "1" };
export type UpdateBlogPayload = Partial<{ blogSubj: string; blogBody: string; recSts: "0" | "1" }>;

export async function getBlogs(): Promise<BlogRow[]> {
  return request<BlogRow[]>("/blog", { method: "GET" });
}
export async function getBlog(id: number): Promise<BlogRow> {
  return request<BlogRow>(`/blog/${id}`, { method: "GET" });
}
export async function createBlog(payload: CreateBlogPayload): Promise<BlogRow> {
  return request<BlogRow>("/blog", {
    method: "POST",
    body: JSON.stringify({
      blogSubj: payload.blogSubj,
      blogBody: payload.blogBody,
      creaBy: payload.creaBy ?? "admin",
      recSts: payload.recSts ?? "1",
    }),
  });
}
export async function updateBlog(id: number, payload: UpdateBlogPayload): Promise<BlogRow> {
  return request<BlogRow>(`/blog/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}
export async function deleteBlog(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/blog/${id}`, { method: "DELETE" });
}

/* ========================= Assign Team (Users) API ========================= */

export type AssignUser = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  recSts: number;
  initials: string;
  /** اسم كامل للعرض */
  fullName?: string;
  /** نص للـ dropdown */
  label?: string;
};

function makeInitials(firstName?: string, lastName?: string, email?: string) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim() || (email ?? "");
  const parts = name.split(/\s+/).filter(Boolean);
  const two = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (two || (email ? email[0] : "?")).toUpperCase();
}

function buildFullName(firstName?: string, lastName?: string, email?: string) {
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return full || email || "";
}

/**
 * يعتمد على /users (page/limit + includeInactive).
 * بيرجع شكل موحّد: { items, total, limit, offset }.
 */
export async function getAssignUsers(params?: {
  search?: string;
  onlyActive?: boolean; // default true
  limit?: number;       // default 20
  offset?: number;      // default 0
}): Promise<{ items: AssignUser[]; total: number; limit: number; offset: number }> {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  const onlyActive = params?.onlyActive ?? true;

  const page = Math.floor(offset / limit) + 1;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  qs.set("includeInactive", onlyActive ? "0" : "1");
  if (params?.search) qs.set("q", params.search);

  try {
    const raw = await request<any>(`/users?${qs.toString()}`, { method: "GET" });

    const rows: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];

    let mapped: AssignUser[] = rows.map((u: any) => {
      const fullName = buildFullName(u.firstName, u.lastName, u.email);
      return {
        id: Number(u.id),
        email: u.email,
        firstName: u.firstName ?? undefined,
        lastName: u.lastName ?? undefined,
        recSts: Number(u.recSts ?? 1),
        initials: makeInitials(u.firstName, u.lastName, u.email),
        fullName,
        label: fullName,
      };
    });

    if (onlyActive) mapped = mapped.filter((u) => u.recSts === 1);
    const total = typeof raw?.total === "number" ? raw.total : mapped.length;

    return { items: mapped, total, limit, offset };
  } catch {
    return { items: [], total: 0, limit, offset };
  }
}

/* ======================= Project Types (Our Services) ======================= */
export const PROJECT_TYPES: string[] = [
  "Web Design & Development",
  "WordPress Expertise",
  "SEO & Growth",
  "Digital Marketing",
  "Performance & Security",
  "Maintenance & Support",
];

export function getProjectTypes(): string[] {
  return PROJECT_TYPES.slice();
}

/* ============================ Projects API ============================ */

export type CreateTaskInput = {
  title: string;
  subject?: string;
  estimatedHours?: number;
  priority?: "Low" | "Medium" | "High";
};

export type CreateProjectInput = {
  projectCode?: string;
  name: string; // <-- هنا التغيير الأساسي
  projectDesc?: string;
  leaderAID?: number;
  /** ممكن تبقى واحدة من PROJECT_TYPES أو أي نص */
  type?: string;
  startDate?: string;
  dueDate?: string;
  budget?: number;
  status?: "On Track" | "Offtrack" | "Completed";
  members: number[];
  tasks: CreateTaskInput[];
};

/** يولّد projectCode قصير ≤ 16 حرف، فيه جزء timestamp + جزء عشوائي لمنع التكرار */
export function generateProjectCode(): string {
  const d = new Date();
  const YY = String(d.getFullYear()).slice(-2);
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  // base36 2 حروف عشوائية
  const rand = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0");
  // النتيجة: PRJ + YYMMDD + hhmm + rand  => من 14 لـ 16 حرف
  return `PRJ${YY}${MM}${DD}${hh}${mm}${rand}`.slice(0, 16);
}

export async function createProject(
  payload: CreateProjectInput
): Promise<{ projectAID: number; membersAdded: number; tasksAdded: number; message: string }> {
  // لو الكود مش مبعوت، ولِّده هنا علشان القيود (طول/Unique)
  const body: CreateProjectInput = {
    ...payload,
    projectCode: (payload.projectCode && payload.projectCode.length <= 16)
      ? payload.projectCode
      : generateProjectCode(),
    status: payload.status ?? "On Track",
  };

  return request("/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ProjectCard = {
  projectAID: number;
  title: string;
  description?: string;
  dueDate?: string;
  status?: string;
  team: string[];
  issuesCount: number;
};

export async function listProjects(params?: {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: ProjectCard[]; total: number; limit: number; offset: number }> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  qs.set("limit", String(params?.limit ?? 20));
  qs.set("offset", String(params?.offset ?? 0));
  return request(`/projects?${qs.toString()}`, { method: "GET" });
}