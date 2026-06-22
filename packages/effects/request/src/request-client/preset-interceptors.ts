import type { RequestClient } from './request-client';
import type { MakeErrorMessageFn, ResponseInterceptorConfig } from './types';

import { $t } from '@vben/locales';
import { isFunction } from '@vben/utils';

import axios from 'axios';

function getBusinessCode(errorOrResponse: any): number | undefined {
  const code =
    errorOrResponse?.data?.code ??
    errorOrResponse?.response?.data?.code ??
    errorOrResponse?.response?.code;

  return typeof code === 'number' ? code : undefined;
}

function isBusinessCodeInRange(
  code: number | undefined,
  min: number,
  max: number,
) {
  return typeof code === 'number' && code >= min && code < max;
}

function getBusinessErrorMessage(error: any) {
  const data = error?.response?.data ?? error?.data ?? {};
  return data?.message ?? data?.detail ?? data?.error;
}

export const defaultResponseInterceptor = ({
  codeField = 'code',
  dataField = 'data',
  successCode = 0,
}: {
  /** Response code field name. */
  codeField: string;
  /** Response data field name, or a resolver that extracts data. */
  dataField: ((response: any) => any) | string;
  /** Successful business code. */
  successCode: ((code: any) => boolean) | number | string;
}): ResponseInterceptorConfig => {
  return {
    fulfilled: (response) => {
      const { config, data: responseData, status } = response;

      if (config.responseReturn === 'raw') {
        return response;
      }

      if (status >= 200 && status < 400) {
        if (config.responseReturn === 'body') {
          return responseData;
        } else if (
          isFunction(successCode)
            ? successCode(responseData[codeField])
            : responseData[codeField] === successCode
        ) {
          return isFunction(dataField)
            ? dataField(responseData)
            : responseData[dataField];
        } else if (
          Object.prototype.hasOwnProperty.call(responseData ?? {}, codeField)
        ) {
          throw Object.assign({}, response, { response });
        }
      }

      throw Object.assign({}, response, { response });
    },
  };
};

export const authenticateResponseInterceptor = ({
  client,
  doReAuthenticate,
  doRefreshToken,
  enableRefreshToken,
  formatToken,
}: {
  client: RequestClient;
  doReAuthenticate: () => Promise<void>;
  doRefreshToken: () => Promise<string>;
  enableRefreshToken: boolean;
  formatToken: (token: string) => null | string;
}): ResponseInterceptorConfig => {
  return {
    rejected: async (error) => {
      const { config, response } = error;
      const businessCode = getBusinessCode(error);
      const isUnauthorized =
        response?.status === 401 ||
        isBusinessCodeInRange(businessCode, 401_000, 402_000);

      if (!isUnauthorized) {
        throw error;
      }

      if (!enableRefreshToken || config.__isRetryRequest) {
        await doReAuthenticate();
        throw error;
      }

      if (client.isRefreshing) {
        return new Promise((resolve) => {
          client.refreshTokenQueue.push((newToken: string) => {
            config.headers.Authorization = formatToken(newToken);
            resolve(client.request(config.url, { ...config }));
          });
        });
      }

      client.isRefreshing = true;
      config.__isRetryRequest = true;

      try {
        const newToken = await doRefreshToken();

        client.refreshTokenQueue.forEach((callback) => callback(newToken));
        client.refreshTokenQueue = [];

        return client.request(error.config.url, { ...error.config });
      } catch (refreshError) {
        client.refreshTokenQueue.forEach((callback) => callback(''));
        client.refreshTokenQueue = [];
        console.error('Refresh token failed, please login again.');
        await doReAuthenticate();

        throw refreshError;
      } finally {
        client.isRefreshing = false;
      }
    },
  };
};

export const errorMessageResponseInterceptor = (
  makeErrorMessage?: MakeErrorMessageFn,
): ResponseInterceptorConfig => {
  return {
    rejected: (error: any) => {
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      const err: string = error?.toString?.() ?? '';
      let errMsg = '';
      if (err?.includes('Network Error')) {
        errMsg = $t('ui.fallback.http.networkError');
      } else if (error?.message?.includes?.('timeout')) {
        errMsg = $t('ui.fallback.http.requestTimeout');
      }
      if (errMsg) {
        makeErrorMessage?.(errMsg, error);
        return Promise.reject(error);
      }

      const businessCode = getBusinessCode(error);
      const businessMessage = getBusinessErrorMessage(error);
      if (typeof businessCode === 'number') {
        const traceId = error?.response?.data?.traceId ?? error?.data?.traceId;

        if (businessCode >= 500_000) {
          makeErrorMessage?.(
            traceId
              ? `${businessMessage || $t('ui.fallback.http.internalServerError')} (${traceId})`
              : businessMessage || $t('ui.fallback.http.internalServerError'),
            error,
          );
          return Promise.reject(error);
        }

        makeErrorMessage?.(
          businessMessage || $t('ui.fallback.http.badRequest'),
          error,
        );
        return Promise.reject(error);
      }

      let errorMessage: string;
      const status = error?.response?.status;

      switch (status) {
        case 400: {
          errorMessage = $t('ui.fallback.http.badRequest');
          break;
        }
        case 401: {
          errorMessage = $t('ui.fallback.http.unauthorized');
          break;
        }
        case 403: {
          errorMessage = $t('ui.fallback.http.forbidden');
          break;
        }
        case 404: {
          errorMessage = $t('ui.fallback.http.notFound');
          break;
        }
        case 408: {
          errorMessage = $t('ui.fallback.http.requestTimeout');
          break;
        }
        default: {
          errorMessage = $t('ui.fallback.http.internalServerError');
        }
      }
      makeErrorMessage?.(errorMessage, error);
      return Promise.reject(error);
    },
  };
};
