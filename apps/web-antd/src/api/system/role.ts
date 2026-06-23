import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemRoleApi {
  export type DataScope = 'all' | 'custom' | 'dept' | 'dept_tree' | 'self';

  export interface SystemRole {
    [key: string]: any;
    id: string;
    code: string;
    createdAt?: string;
    dataScope?: DataScope;
    deptIds?: string[];
    menuIds?: Array<number | string>;
    name: string;
    remark?: string;
    status: 0 | 1;
    updatedAt?: string;
  }

  export type RolePayload = Omit<SystemRole, 'createdAt' | 'id' | 'updatedAt'>;
  export type RoleUpdatePayload = Partial<RolePayload>;

  export interface RoleOption {
    label: string;
    value: string;
  }
}

/**
 * 获取角色列表数据
 */
async function getRoleList(params: Recordable<any>) {
  return requestClient.get<Array<SystemRoleApi.SystemRole>>('/role/list', {
    params,
  });
}

/**
 * 创建角色
 * @param data 角色数据
 */
async function createRole(data: SystemRoleApi.RolePayload) {
  return requestClient.post('/role', data);
}

/**
 * 更新角色
 *
 * @param id 角色 ID
 * @param data 角色数据
 */
async function updateRole(id: string, data: SystemRoleApi.RoleUpdatePayload) {
  return requestClient.put(`/role/${id}`, data);
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: string) {
  return requestClient.delete(`/role/${id}`);
}

async function getRoleOptions(params: Recordable<any>) {
  const resp = await requestClient.get<
    | Array<SystemRoleApi.RoleOption | SystemRoleApi.SystemRole>
    | { items: SystemRoleApi.SystemRole[] }
  >('/role/list', { params });
  const items = Array.isArray(resp) ? resp : resp.items;

  return items.map((item: any) => ({
    label: item.name ?? item.code,
    value: item.code ?? item.value,
  }));
}

export { createRole, deleteRole, getRoleList, getRoleOptions, updateRole };
