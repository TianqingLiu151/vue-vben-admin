import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser {
    id: number;
    username: string;
    realName?: string;
    roles?: string[];
    homePath?: string;
    [key: string]: any;
  }
}

/**
 * 获取用户列表数据
 */
export async function getUserList(params: Recordable<any>) {
  return requestClient.get<any>(
    '/system/user/list',
    { params },
  );
}

/**
 * 创建用户
 * @param data 用户数据
 */
export async function createUser(data: Omit<SystemUserApi.SystemUser, 'id'>) {
  return requestClient.post('/system/user', data);
}

/**
 * 更新用户
 *
 * @param id 用户 ID
 * @param data 用户数据
 */
export async function updateUser(
  id: number,
  data: Omit<SystemUserApi.SystemUser, 'id'>,
) {
  return requestClient.put(`/system/user/${id}`, data);
}

/**
 * 删除用户
 * @param id 用户 ID
 */
export async function deleteUser(id: number) {
  return requestClient.delete(`/system/user/${id}`);
}
