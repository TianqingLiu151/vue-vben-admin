import { requestClient } from '#/api/request';

export namespace AuthApi {
  export interface LoginParams {
    captchaAnswer?: string;
    captchaId?: string;
    password?: string;
    username?: string;
  }

  export interface CaptchaResult {
    captchaId: string;
    expiresIn?: number;
    question: string;
  }

  export interface LoginResult {
    accessToken: string;
    expiresIn?: number;
    mustChangePassword?: boolean;
    refreshExpiresIn?: number;
    refreshToken: string;
  }

  export interface RefreshTokenResult {
    accessToken: string;
    expiresIn?: number;
    refreshExpiresIn?: number;
    refreshToken: string;
  }

  export interface Session {
    createdAt?: string;
    deviceLabel?: null | string;
    expiresAt?: string;
    ip?: string;
    lastSeenAt?: string;
    revokedReason?: null | string;
    sessionId: string;
    status?: string;
    userAgent?: string;
    userId?: number;
    username?: string;
  }

  export interface ForceLogoutResult {
    revoked: number;
  }
}

export async function getCaptchaApi() {
  return requestClient.get<AuthApi.CaptchaResult>('/auth/captcha');
}

export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

export async function refreshTokenApi(data: { refreshToken: null | string }) {
  return requestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', data);
}

export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}

export async function getMySessionsApi() {
  return requestClient.get<AuthApi.Session[]>('/auth/sessions/me');
}

export async function revokeMySessionApi(sessionId: string) {
  return requestClient.delete(`/auth/sessions/${sessionId}`);
}

export async function getOnlineUsersApi(params?: { username?: string }) {
  return requestClient.get<AuthApi.Session[]>('/auth/online-users', {
    params,
  });
}

export async function kickOnlineUserApi(sessionId: string) {
  return requestClient.delete(`/auth/online-users/${sessionId}`);
}

export async function forceLogoutUserApi(userId: number) {
  return requestClient.delete<AuthApi.ForceLogoutResult>(
    `/auth/users/${userId}/sessions`,
  );
}
