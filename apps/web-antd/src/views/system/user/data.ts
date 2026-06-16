import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api';

import { z } from '#/adapter/form';
import { getRoleOptions } from '#/api';
import { $t } from '#/locales';

export function useFormSchema(options?: {
  onRoleSearch?: (keyword: string) => void;
}): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      dependencies: {
        disabled: (values) => {
          return !!values.id;
        },
        triggerFields: ['id'],
      },
      fieldName: 'username',
      label: $t('system.user.username'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.user.username')])),
    },
    {
      component: 'InputPassword',
      dependencies: {
        show: (values) => {
          return !values.id;
        },
        triggerFields: ['id'],
      },
      fieldName: 'password',
      label: $t('system.user.password'),
      rules: z.string().optional(),
    },
    {
      component: 'Input',
      fieldName: 'realName',
      label: $t('system.user.realName'),
      rules: z.string().optional(),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getRoleOptions,
        class: 'w-full',
        dropdownMatchSelectWidth: false,
        dropdownStyle: { minWidth: '360px' },
        filterOption: false,
        mode: 'multiple',
        onClear() {
          options?.onRoleSearch?.('');
        },
        onSearch(value: string) {
          options?.onRoleSearch?.(value);
        },
        params: {
          limit: 200,
        },
        showSearch: true,
      },
      defaultValue: [],
      fieldName: 'roles',
      label: $t('system.user.roles'),
      rules: z.array(z.string()).optional(),
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
      label: '状态',
    },
    {
      component: 'Input',
      fieldName: 'homePath',
      label: $t('system.user.homePath'),
      rules: z.string().optional(),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.username'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<SystemUserApi.SystemUser>,
  can: (code: string) => boolean,
): VxeTableGridColumns<SystemUserApi.SystemUser> {
  return [
    {
      field: 'username',
      title: $t('system.user.username'),
      width: 180,
    },
    {
      field: 'realName',
      title: $t('system.user.realName'),
      width: 180,
    },
    {
      field: 'roles',
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) ? cellValue.join(', ') : '',
      minWidth: 220,
      title: $t('system.user.roles'),
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: '状态',
      width: 100,
    },
    {
      field: 'homePath',
      minWidth: 180,
      title: $t('system.user.homePath'),
    },
    {
      field: 'createdAt',
      title: $t('system.user.createTime'),
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'username',
          nameTitle: $t('system.user.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: () => can('system:user:update'),
          },
          {
            code: 'delete',
            show: () => can('system:user:delete'),
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.user.operation'),
      width: 140,
    },
  ];
}
