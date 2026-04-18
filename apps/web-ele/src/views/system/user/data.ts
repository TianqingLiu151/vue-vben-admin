import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api';

/**
 * 获取用户表单配置（用于新增、编辑弹窗）
 * @returns 表单 Schema 数组
 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: '用户名',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'password',
      label: '密码',
      help: '创建时必填，编辑时若不修改请留空',
    },
    {
      component: 'Input',
      fieldName: 'realName',
      label: '真实姓名',
    },
    {
      component: 'Select',
      fieldName: 'roles',
      label: '角色',
      componentProps: {
        mode: 'multiple',
        options: [
          { label: 'Super Admin', value: 'super' },
          { label: 'Admin', value: 'admin' },
          { label: 'User', value: 'user' },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'homePath',
      label: '首页路径',
    },
  ];
}

/**
 * 获取列表搜索表单配置（用于表格顶部的条件查询）
 * @returns 搜索表单 Schema 数组
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: '用户名',
    },
  ];
}

/**
 * 获取表格列配置
 * @param onActionClick 操作列点击事件回调
 * @returns VxeTable 列配置数组
 */
export function useColumns<T = SystemUserApi.SystemUser>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'id',
      title: 'ID',
      width: 100,
    },
    {
      field: 'username',
      title: '用户名',
      width: 200,
    },
    {
      field: 'realName',
      title: '真实姓名',
      width: 200,
    },
    {
      field: 'roles',
      title: '角色',
      minWidth: 150,
      formatter: ({ cellValue }) => {
        if (Array.isArray(cellValue)) {
          return cellValue.join(', ');
        }
        return cellValue || '';
      },
    },
    {
      field: 'homePath',
      title: '首页路径',
      minWidth: 150,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'username',
          nameTitle: '用户名',
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 130,
    },
  ];
}
