import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

export interface UserPasswordUpdateParams {
  newPassword: string;
  oldPassword: string;
}

export interface UserProfileUpdateParams {
  homePath?: string;
  realName?: string;
}

function pickFirstDefined<T>(...values: T[]) {
  return values.find((value) => value !== undefined && value !== null);
}

function normalizeUserInfo(raw: Record<string, any> & UserInfo): UserInfo {
  const userInfo = { ...raw };

  const realName = pickFirstDefined(
    userInfo.realName,
    raw.real_name,
    raw.realname,
    raw.nickname,
    raw.nickName,
    raw.profile?.realName,
    raw.profile?.real_name,
    raw.profile?.nickname,
  );
  if (realName !== undefined) {
    userInfo.realName = realName;
  }

  const homePath = pickFirstDefined(
    userInfo.homePath,
    raw.home_path,
    raw.homepath,
    raw.profile?.homePath,
    raw.profile?.home_path,
  );
  if (homePath !== undefined) {
    userInfo.homePath = homePath;
  }

  const deptId = pickFirstDefined(
    userInfo.deptId,
    raw.dept_id,
    raw.deptid,
    raw.profile?.deptId,
    raw.profile?.dept_id,
  );
  if (deptId !== undefined) {
    userInfo.deptId = deptId;
  }

  return userInfo;
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  const data = await requestClient.get<Record<string, any> & UserInfo>(
    '/user/info',
  );
  return normalizeUserInfo(data);
}

/**
 * 更新当前登录用户基础资料
 */
export async function updateUserProfileApi(data: UserProfileUpdateParams) {
  const resp = await requestClient.put<Record<string, any> & UserInfo>(
    '/user/profile',
    data,
  );
  return normalizeUserInfo(resp);
}

/**
 * 更新当前登录用户密码
 */
export async function updateUserPasswordApi(data: UserPasswordUpdateParams) {
  return requestClient.put<null>('/user/password', data);
}
