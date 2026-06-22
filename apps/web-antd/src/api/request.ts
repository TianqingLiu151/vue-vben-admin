import type {
  ApiResponse,
  AxiosResponseHeaders,
  RequestClientOptions,
} from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';
import { cloneDeep } from '@vben/utils';

import { message } from 'ant-design-vue';
import JSONBigInt from 'json-bigint';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

type ApiErrorResponse = ApiResponse<unknown> & {
  detail?: string;
  error?: string;
};

function getResponseData(error: any): Partial<ApiErrorResponse> {
  return error?.response?.data ?? error?.data ?? error ?? {};
}

function getResponseMessage(error: any, fallback = '请求失败') {
  const data = getResponseData(error);
  return data.message ?? data.detail ?? data.error ?? error?.message ?? fallback;
}

function formatSystemErrorMessage(data: Partial<ApiErrorResponse>) {
  const fallback = '系统繁忙，请稍后重试';
  const text = data.message || fallback;
  return data.traceId ? `${text}（错误编号：${data.traceId}）` : text;
}

export function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createIdempotencyHeaders() {
  return {
    'Idempotency-Key': createIdempotencyKey(),
  };
}

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
    transformResponse: (data: any, header: AxiosResponseHeaders) => {
      if (
        header.getContentType()?.toString().includes('application/json') &&
        typeof data === 'string'
      ) {
        return cloneDeep(
          JSONBigInt({ storeAsString: true, strict: true }).parse(data),
        );
      }
      return data;
    },
  });

  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired.');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    accessStore.setRefreshToken(null);

    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi({
      refreshToken: accessStore.refreshToken,
    });
    const newToken = resp.accessToken;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  function createRequestId() {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      config.headers['X-Request-Id'] = createRequestId();
      return config;
    },
  });

  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const responseData = getResponseData(error);
      const code = responseData.code;

      if (typeof code === 'number' && code >= 500_000) {
        message.error(formatSystemErrorMessage(responseData));
        return;
      }

      message.error(getResponseMessage(error, msg));
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });

export interface PageFetchParams {
  [key: string]: any;
  pageNo?: number;
  pageSize?: number;
}
