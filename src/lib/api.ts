const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

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

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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

export async function createUser(payload: CreateUserPayload): Promise<UserResponse> {
  return request<UserResponse>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyEmailCode(payload: VerifyCodePayload): Promise<VerifyCodeResponse> {
  return request<VerifyCodeResponse>('/users/verify-code', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { ApiError };
