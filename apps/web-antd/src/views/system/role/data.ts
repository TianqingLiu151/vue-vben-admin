import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api';

import { z } from '#/adapter/form';
import { getDeptList } from '#/api';
import { $t } from '#/locales';

export const dataScopeOptions: Array<{
  color: string;
  label: string;
  value: SystemRoleApi.DataScope;
}> = [
  { color: 'default', label: '本人数据', value: 'self' },
  { color: 'processing', label: '本部门数据', value: 'dept' },
  { color: 'success', label: '本部门及下级', value: 'dept_tree' },
  { color: 'warning', label: '自定义部门', value: 'custom' },
  { color: 'error', label: '全部数据', value: 'all' },
];

export function getDataScopeOption(dataScope?: string) {
  return dataScopeOptions.find((item) => item.value === dataScope);
}

export function useFormSchema(options?: {
  onDataScopeChange?: (dataScope: SystemRoleApi.DataScope) => void;
}): VbenFormSchema[] {
  return [
    {
      component: 'Divider',
      fieldName: 'baseInfoDivider',
      formItemClass: 'col-span-2 md:col-span-2 pb-0',
      hideLabel: true,
      renderComponentContent: () => ({
        default: () => '基础信息',
      }),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.role.id'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'status',
      label: $t('system.role.status'),
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('system.role.remark'),
    },
    {
      component: 'Divider',
      fieldName: 'menuPermissionDivider',
      formItemClass: 'col-span-2 md:col-span-2 pb-0',
      hideLabel: true,
      renderComponentContent: () => ({
        default: () => '菜单权限',
      }),
    },
    {
      component: 'Input',
      fieldName: 'menuIds',
      formItemClass: 'items-start',
      label: $t('system.role.setPermissions'),
      modelPropName: 'modelValue',
    },
    {
      component: 'Divider',
      fieldName: 'dataPermissionDivider',
      formItemClass: 'col-span-2 md:col-span-2 pb-0',
      hideLabel: true,
      renderComponentContent: () => ({
        default: () => '数据权限',
      }),
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        onChange(value: SystemRoleApi.DataScope) {
          options?.onDataScopeChange?.(value);
        },
        options: dataScopeOptions,
      },
      defaultValue: 'self',
      fieldName: 'dataScope',
      label: '数据范围',
      rules: 'selectRequired',
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getDeptList,
        childrenField: 'children',
        class: 'w-full',
        labelField: 'name',
        multiple: true,
        showCheckedStrategy: 'SHOW_PARENT',
        showSearch: true,
        treeCheckable: true,
        treeDefaultExpandAll: true,
        valueField: 'id',
      },
      dependencies: {
        rules: (values) =>
          values.dataScope === 'custom'
            ? z.array(z.string()).min(1, '请选择至少一个部门')
            : null,
        show: (values) => values.dataScope === 'custom',
        triggerFields: ['dataScope'],
      },
      defaultValue: [],
      fieldName: 'deptIds',
      label: '自定义部门',
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
    },
    { component: 'Input', fieldName: 'code', label: $t('system.role.id') },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
      },
      fieldName: 'status',
      label: $t('system.role.status'),
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: $t('system.role.remark'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.role.createTime'),
    },
  ];
}

export function useColumns<T = SystemRoleApi.SystemRole>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
  can?: (code: string) => boolean,
): VxeTableGridColumns {
  const canUpdate = can?.('system:role:update') ?? true;

  return [
    {
      field: 'name',
      title: $t('system.role.roleName'),
      width: 200,
    },
    {
      field: 'code',
      title: $t('system.role.id'),
      width: 200,
    },
    {
      cellRender: {
        attrs: { beforeChange: canUpdate ? onStatusChange : undefined },
        name: onStatusChange && canUpdate ? 'CellSwitch' : 'CellTag',
      },
      field: 'status',
      title: $t('system.role.status'),
      width: 100,
    },
    {
      field: 'remark',
      minWidth: 100,
      title: $t('system.role.remark'),
    },
    {
      field: 'dataScope',
      slots: { default: 'dataScope' },
      title: '数据范围',
      width: 180,
    },
    {
      field: 'createTime',
      title: $t('system.role.createTime'),
      width: 200,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.role.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: () => canUpdate,
          },
          {
            code: 'delete',
            show: () => can?.('system:role:delete') ?? true,
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.role.operation'),
      width: 130,
    },
  ];
}
