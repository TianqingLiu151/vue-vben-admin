import { requestClient } from '#/api/request';

export namespace SystemSchedulerApi {
  export type SchedulerTriggerType = 'cron' | 'interval';
  export type SchedulerRunStatus = 'failed' | 'skipped' | 'success';

  export interface PageResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface SchedulerJobItem {
    coalesce: boolean;
    code: string;
    configVersion: number;
    createdAt?: string;
    cronExpression?: string;
    description?: string;
    enabled: boolean;
    intervalSeconds?: number;
    lastMessage?: string;
    lastRunAt?: string;
    lastStatus?: SchedulerRunStatus;
    maxInstances: number;
    misfireGraceSeconds: number;
    name: string;
    nextRunAt?: string;
    triggerType: SchedulerTriggerType;
    updatedAt?: string;
  }

  export interface SchedulerJobUpdateParams {
    coalesce?: boolean;
    cronExpression?: string;
    description?: string;
    enabled?: boolean;
    intervalSeconds?: number;
    maxInstances?: number;
    misfireGraceSeconds?: number;
    name?: string;
    triggerType?: SchedulerTriggerType;
  }

  export interface SchedulerJobLogItem {
    createdAt?: string;
    durationMs?: number;
    error?: string;
    finishedAt?: string;
    id: number;
    jobCode: string;
    message?: string;
    startedAt: string;
    status: SchedulerRunStatus;
  }
}

function normalizePage<T>(
  data: SystemSchedulerApi.PageResult<T> | T[],
  page = 1,
  pageSize = 10,
): SystemSchedulerApi.PageResult<T> {
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

export async function getSchedulerJobs(params: {
  page?: number;
  pageSize?: number;
}) {
  const resp = await requestClient.get<
    | SystemSchedulerApi.PageResult<SystemSchedulerApi.SchedulerJobItem>
    | SystemSchedulerApi.SchedulerJobItem[]
  >('/scheduler/jobs', { params });

  return normalizePage(resp, params.page, params.pageSize);
}

export function getSchedulerJob(code: string) {
  return requestClient.get<SystemSchedulerApi.SchedulerJobItem>(
    `/scheduler/jobs/${code}`,
  );
}

export function updateSchedulerJob(
  code: string,
  data: SystemSchedulerApi.SchedulerJobUpdateParams,
) {
  return requestClient.put<SystemSchedulerApi.SchedulerJobItem>(
    `/scheduler/jobs/${code}`,
    data,
  );
}

export function enableSchedulerJob(code: string) {
  return requestClient.request<SystemSchedulerApi.SchedulerJobItem>(
    `/scheduler/jobs/${code}/enable`,
    { method: 'PATCH' },
  );
}

export function disableSchedulerJob(code: string) {
  return requestClient.request<SystemSchedulerApi.SchedulerJobItem>(
    `/scheduler/jobs/${code}/disable`,
    { method: 'PATCH' },
  );
}

export function runSchedulerJob(code: string) {
  return requestClient.post<SystemSchedulerApi.SchedulerJobLogItem>(
    `/scheduler/jobs/${code}/run`,
  );
}

export async function getSchedulerJobLogs(
  code: string,
  params: { page?: number; pageSize?: number },
) {
  const resp = await requestClient.get<
    | SystemSchedulerApi.PageResult<SystemSchedulerApi.SchedulerJobLogItem>
    | SystemSchedulerApi.SchedulerJobLogItem[]
  >(`/scheduler/jobs/${code}/logs`, { params });

  return normalizePage(resp, params.page, params.pageSize);
}
