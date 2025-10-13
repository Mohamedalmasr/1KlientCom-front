export type AuthRole = "admin" | "member";
export type AuthUser = { id: string; name: string; role: AuthRole; avatarUrl?: string };
export type AuthState = { user: AuthUser; token: string };

export const AUTH_KEY = "ok_auth";
const DEFAULT_ROLE: AuthRole = "member";

/* ========= helpers ========= */
export function resolveRole(role?: string | null): AuthRole {
  if (typeof role === "string") {
    const normalized = role.trim().toLowerCase();
    if (normalized === "admin" || normalized === "administrator" || normalized === "super_admin") {
      return "admin";
    }
  }
  return DEFAULT_ROLE;
}

function normalizeUser(user: AuthUser): AuthUser {
  return { ...user, role: resolveRole(user.role) };
}

function readJson(key: string): any {
  const value = localStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

type LegacyUser =
  | { id?: number | string; email?: string; firstName?: string; lastName?: string; name?: string; role?: string | null }
  | null
  | undefined;

function buildName(u: LegacyUser): string | undefined {
  if (!u) return undefined;
  if (typeof (u as any).name === "string" && (u as any).name.trim()) return (u as any).name.trim();
  const parts = [u.firstName, u.lastName]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (typeof u.email === "string" && u.email.includes("@")) return u.email.split("@")[0]!;
  return undefined;
}

function toAuthUser(raw: LegacyUser): AuthUser | null {
  if (!raw) return null;
  const id = raw.id ?? (raw as any).email;
  if (id === undefined || id === null) return null;
  const name = buildName(raw) ?? String(id);
  const roleSource =
    typeof raw.role === "string"
      ? raw.role
      : typeof (raw as any).Role === "string"
      ? ((raw as any).Role as string)
      : undefined;
  return {
    id: String(id),
    name,
    role: resolveRole(roleSource),
  };
}

function decodeJwtPayload(token: string): any | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* ========= unified save/clear/load ========= */
export function saveAuth(auth: AuthState) {
  const normalized: AuthState = {
    token: auth.token,
    user: normalizeUser(auth.user),
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event("ok-auth-change"));
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
  } catch {}
  window.dispatchEvent(new Event("ok-auth-change"));
}

export function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthState;
    return { token: parsed.token, user: normalizeUser(parsed.user) };
  } catch {
    return null;
  }
}

/* ========= role getters (with JWT fallback) ========= */
export function getRoleFromToken(): AuthRole | null {
  try {
    const t = localStorage.getItem("authToken");
    if (!t) return null;
    const payload = decodeJwtPayload(t);
    return resolveRole(payload?.role);
  } catch {
    return null;
  }
}

export function getStoredAuthUser(): AuthUser | null {
  const sources: Array<LegacyUser> = [];

  const snapshot = loadAuth();
  if (snapshot?.user) sources.push(snapshot.user);

  const auth = readJson("auth");
  if (auth?.user) sources.push(auth.user);
  else if (auth) sources.push(auth);

  const legacy = readJson("authUser");
  if (legacy) sources.push(legacy);

  const fallback = readJson("user");
  if (fallback) sources.push(fallback);

  let best: AuthUser | null = null;
  for (const src of sources) {
    const candidate = toAuthUser(src);
    if (!candidate) continue;
    if (!best) {
      best = candidate;
      continue;
    }
    if (best.role !== "admin" && candidate.role === "admin") {
      best = candidate;
    }
  }

  // Fallback: build user from JWT if nothing in storage
  if (!best) {
    const t = localStorage.getItem("authToken");
    const payload = t ? decodeJwtPayload(t) : null;
    if (payload) {
      const role = resolveRole(payload?.role);
      const id = payload?.sub ?? payload?.id ?? "me";
      const name =
        (typeof payload?.email === "string" && payload.email.includes("@")
          ? payload.email.split("@")[0]
          : "User") || "User";
      best = { id: String(id), name, role };
    }
  }

  return best;
}

export function getStoredRole(): AuthRole {
  const user = getStoredAuthUser();
  if (user) return user.role;
  const fromToken = getRoleFromToken();
  return fromToken ?? DEFAULT_ROLE;
}
