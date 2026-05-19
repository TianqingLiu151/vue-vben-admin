import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser {
    id: number;
    username: string;
    realName?: string;
    roles?: string[];
    homePath?: string;
    createTime?: number | string;
    [key: string]: any;
  }

  export interface UserCreate {
    username: string;
    password: string;
    realName?: string;
    roles: string[];
    homePath?: string;
  }

  export interface UserUpdate {
    realName?: string;
    roles?: string[];
    homePath?: string;
    password?: string;
  }
}

/**
 * 获取用户列表数据
 */
export async function getUserList(params: Recordable<any>) {
  const resp = await requestClient.get<any>('/system/user/list', { params });

  const pickFirstDefined = <T>(...values: T[]) =>
    values.find((v) => v !== undefined);

  const normalizeUser = (raw: any): SystemUserApi.SystemUser => {
    const user = { ...raw } as SystemUserApi.SystemUser;

    const realName = pickFirstDefined(
      user.realName,
      raw?.real_name,
      raw?.realname,
      raw?.profile?.realName,
      raw?.profile?.real_name,
    );
    if (user.realName === undefined && realName !== undefined) {
      user.realName = realName as any;
    }

    const homePath = pickFirstDefined(
      user.homePath,
      raw?.home_path,
      raw?.homepath,
      raw?.profile?.homePath,
      raw?.profile?.home_path,
    );
    if (user.homePath === undefined && homePath !== undefined) {
      user.homePath = homePath as any;
    }

    const createTime = pickFirstDefined(
      user.createTime,
      raw?.create_time,
      raw?.created_at,
      raw?.createdAt,
      raw?.createAt,
      raw?.create_at,
      raw?.createdTime,
    );
    if (user.createTime === undefined && createTime !== undefined) {
      user.createTime = createTime as any;
    }

    return user;
  };

  if (Array.isArray(resp)) {
    return resp.map((item) => normalizeUser(item));
  }

  if (resp && Array.isArray(resp.items)) {
    return {
      ...resp,
      items: resp.items.map((item: any) => normalizeUser(item)),
    };
  }

  return resp;
}

/**
 * 创建用户
 * @param data 用户数据
 */
export async function createUser(data: SystemUserApi.UserCreate) {
  return requestClient.post('/system/user', data);
}

/**
 * 更新用户
 *
 * @param id 用户 ID
 * @param data 用户数据
 */
export async function updateUser(id: number, data: SystemUserApi.UserUpdate) {
  return requestClient.put(`/system/user/${id}`, data);
}

/**
 * 删除用户
 * @param id 用户 ID
 */
export async function deleteUser(id: number) {
  return requestClient.delete(`/system/user/${id}`);
}
