import { requestClient } from '#/api/request';

export namespace SystemDeptApi {
  export interface SystemDept {
    [key: string]: any;
    children?: SystemDept[];
    createdAt?: string;
    id: string;
    name: string;
    pid?: null | string;
    remark?: string;
    status: 0 | 1;
    updatedAt?: string;
  }
}

/**
 * 获取部门列表数据
 */
async function getDeptList() {
  return requestClient.get<Array<SystemDeptApi.SystemDept>>('/dept/list');
}

/**
 * 创建部门
 * @param data 部门数据
 */
async function createDept(
  data: Omit<SystemDeptApi.SystemDept, 'children' | 'id'>,
) {
  return requestClient.post('/dept', data);
}

/**
 * 更新部门
 *
 * @param id 部门 ID
 * @param data 部门数据
 */
async function updateDept(
  id: string,
  data: Omit<SystemDeptApi.SystemDept, 'children' | 'id'>,
) {
  return requestClient.put(`/dept/${id}`, data);
}

/**
 * 删除部门
 * @param id 部门 ID
 */
async function deleteDept(id: string) {
  return requestClient.delete(`/dept/${id}`);
}

export { createDept, deleteDept, getDeptList, updateDept };
