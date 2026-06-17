import { requestClient } from '#/api/request';

export namespace SystemDictApi {
  export interface PageResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface DictTypeItem {
    code: string;
    createdAt?: string;
    id: string;
    name: string;
    remark?: string;
    status: number;
    updatedAt?: string;
  }

  export interface DictTypeParams {
    code?: string;
    name?: string;
    page?: number;
    pageSize?: number;
    status?: number;
  }

  export interface DictTypeForm {
    code?: string;
    name?: string;
    remark?: string;
    status?: number;
  }

  export interface DictItemItem {
    color?: string;
    createdAt?: string;
    cssClass?: string;
    dictCode: string;
    id: string;
    isDefault: boolean;
    label: string;
    remark?: string;
    sort: number;
    status: number;
    updatedAt?: string;
    value: string;
  }

  export interface DictItemParams {
    dictCode?: string;
    label?: string;
    page?: number;
    pageSize?: number;
    status?: number;
  }

  export interface DictItemForm {
    color?: string;
    cssClass?: string;
    dictCode?: string;
    isDefault?: boolean;
    label?: string;
    remark?: string;
    sort?: number;
    status?: number;
    value?: string;
  }

  export interface DictOption {
    color?: string;
    cssClass?: string;
    isDefault: boolean;
    label: string;
    sort: number;
    value: string;
  }
}

function normalizePage<T>(
  data: SystemDictApi.PageResult<T> | T[],
  page = 1,
  pageSize = 10,
): SystemDictApi.PageResult<T> {
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

const pickFirstDefined = <T>(...values: T[]) =>
  values.find((value) => value !== undefined);

function normalizeDictType(raw: any): SystemDictApi.DictTypeItem {
  return {
    ...raw,
    createdAt: pickFirstDefined(raw?.createdAt, raw?.created_at),
    updatedAt: pickFirstDefined(raw?.updatedAt, raw?.updated_at),
  };
}

function normalizeDictItem(raw: any): SystemDictApi.DictItemItem {
  return {
    ...raw,
    createdAt: pickFirstDefined(raw?.createdAt, raw?.created_at),
    cssClass: pickFirstDefined(raw?.cssClass, raw?.css_class),
    dictCode: pickFirstDefined(raw?.dictCode, raw?.dict_code),
    isDefault: pickFirstDefined(raw?.isDefault, raw?.is_default, false),
    updatedAt: pickFirstDefined(raw?.updatedAt, raw?.updated_at),
  };
}

function normalizeDictOption(raw: any): SystemDictApi.DictOption {
  return {
    ...raw,
    cssClass: pickFirstDefined(raw?.cssClass, raw?.css_class),
    isDefault: pickFirstDefined(raw?.isDefault, raw?.is_default, false),
  };
}

export async function getDictTypeList(params: SystemDictApi.DictTypeParams) {
  const resp = await requestClient.get<
    | SystemDictApi.DictTypeItem[]
    | SystemDictApi.PageResult<SystemDictApi.DictTypeItem>
  >('/dict/type/list', { params });

  const page = normalizePage(resp, params.page, params.pageSize);
  return {
    ...page,
    items: page.items.map(normalizeDictType),
  };
}

export function createDictType(data: SystemDictApi.DictTypeForm) {
  return requestClient.post<SystemDictApi.DictTypeItem>('/dict/type', data);
}

export function updateDictType(
  id: string,
  data: SystemDictApi.DictTypeForm,
) {
  return requestClient.put<SystemDictApi.DictTypeItem>(`/dict/type/${id}`, data);
}

export function deleteDictType(id: string) {
  return requestClient.delete<void>(`/dict/type/${id}`);
}

export async function getDictItemList(params: SystemDictApi.DictItemParams) {
  const resp = await requestClient.get<
    | SystemDictApi.DictItemItem[]
    | SystemDictApi.PageResult<SystemDictApi.DictItemItem>
  >('/dict/item/list', { params });

  const page = normalizePage(resp, params.page, params.pageSize);
  return {
    ...page,
    items: page.items.map(normalizeDictItem),
  };
}

export function createDictItem(data: SystemDictApi.DictItemForm) {
  return requestClient.post<SystemDictApi.DictItemItem>('/dict/item', data);
}

export function updateDictItem(
  id: string,
  data: SystemDictApi.DictItemForm,
) {
  return requestClient.put<SystemDictApi.DictItemItem>(`/dict/item/${id}`, data);
}

export function deleteDictItem(id: string) {
  return requestClient.delete<void>(`/dict/item/${id}`);
}

export async function getDictOptions(code: string) {
  const resp = await requestClient.get<SystemDictApi.DictOption[]>(
    `/dict/options/${code}`,
  );

  return resp.map(normalizeDictOption);
}

export async function getDictOptionsMap(codes: string[]) {
  const resp = await requestClient.get<
    Record<string, SystemDictApi.DictOption[]>
  >(
    '/dict/options',
    {
      params: { codes: codes.join(',') },
    },
  );

  return Object.fromEntries(
    Object.entries(resp).map(([code, options]) => [
      code,
      options.map(normalizeDictOption),
    ]),
  );
}
