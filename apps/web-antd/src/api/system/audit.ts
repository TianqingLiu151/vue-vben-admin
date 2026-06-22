import { requestClient } from '#/api/request';

export namespace SystemAuditApi {
  export type AuditStatus = 'failed' | 'success';

  export interface PageResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface LoginLogQueryParams {
    endTime?: string;
    eventType?: string;
    ip?: string;
    page?: number;
    pageSize?: number;
    startTime?: string;
    status?: AuditStatus;
    username?: string;
  }

  export interface OperationLogQueryParams {
    action?: string;
    endTime?: string;
    ip?: string;
    module?: string;
    operatorUsername?: string;
    page?: number;
    pageSize?: number;
    riskLevel?: string;
    startTime?: string;
    status?: AuditStatus;
    targetId?: string;
    targetType?: string;
  }

  export interface LoginLogItem {
    created_at?: string;
    event_type: string;
    failure_reason?: null | string;
    id: number;
    ip?: string;
    request_id?: string;
    status: AuditStatus;
    user_agent?: string;
    user_id?: number;
    username?: string;
  }

  export interface OperationLogItem {
    action: string;
    created_at?: string;
    id: number;
    ip?: string;
    method?: string;
    module: string;
    operator_id?: number;
    operator_username?: string;
    path?: string;
    permission_code?: string;
    request_id?: string;
    risk_level: string;
    status: AuditStatus;
    target_id?: string;
    target_name?: string;
    target_type?: string;
  }

  export interface OperationLogDetail extends OperationLogItem {
    after_data?: Record<string, unknown>;
    before_data?: Record<string, unknown>;
    changed_fields?: Record<string, { after: unknown; before: unknown }>;
    error_message?: null | string;
    user_agent?: string;
  }
}

function normalizePage<T>(
  data: SystemAuditApi.PageResult<T> | T[],
  page = 1,
  pageSize = 10,
): SystemAuditApi.PageResult<T> {
  if (Array.isArray(data)) {
    return {
      items: data,
      page,
      pageSize,
      total: data.length,
    };
  }

  return {
    items: data.items ?? [],
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    total: data.total ?? data.items?.length ?? 0,
  };
}

export async function getAuditLoginLogs(
  params: SystemAuditApi.LoginLogQueryParams,
) {
  const resp = await requestClient.get<
    | SystemAuditApi.LoginLogItem[]
    | SystemAuditApi.PageResult<SystemAuditApi.LoginLogItem>
  >('/audit/login-logs', { params });

  return normalizePage(resp, params.page, params.pageSize);
}

export async function getAuditOperationLogs(
  params: SystemAuditApi.OperationLogQueryParams,
) {
  const resp = await requestClient.get<
    | SystemAuditApi.OperationLogItem[]
    | SystemAuditApi.PageResult<SystemAuditApi.OperationLogItem>
  >('/audit/operation-logs', { params });

  return normalizePage(resp, params.page, params.pageSize);
}

export function getAuditOperationLogDetail(logId: number | string) {
  return requestClient.get<SystemAuditApi.OperationLogDetail>(
    `/audit/operation-logs/${logId}`,
  );
}
