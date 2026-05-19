import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';

import { z } from '#/adapter/form';
import { getDeptList } from '#/api/system/dept';
import { $t } from '#/locales';

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.dept.deptName'),
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.dept.deptName'), 2]))
        .max(
          20,
          $t('ui.formRules.maxLength', [$t('system.dept.deptName'), 20]),
        ),
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getDeptList,
        childrenField: 'children',
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
      },
      fieldName: 'pid',
      label: $t('system.dept.parentDept'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
      },
      defaultValue: 1,
      fieldName: 'status',
      label: $t('system.dept.status'),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 50,
        rows: 3,
        showCount: true,
      },
      fieldName: 'remark',
      label: $t('system.dept.remark'),
      rules: z
        .string()
        .max(50, $t('ui.formRules.maxLength', [$t('system.dept.remark'), 50]))
        .optional(),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<SystemDeptApi.SystemDept>,
): VxeTableGridColumns<SystemDeptApi.SystemDept> {
  return [
    {
      align: 'left',
      field: 'name',
      fixed: 'left',
      title: $t('system.dept.deptName'),
      treeNode: true,
      width: 180,
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: $t('system.dept.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.dept.createTime'),
      width: 180,
    },
    {
      field: 'remark',
      minWidth: 180,
      title: $t('system.dept.remark'),
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.dept.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'append', text: '新增下级' },
          'edit',
          {
            code: 'delete',
            disabled: (row: SystemDeptApi.SystemDept) =>
              !!(row.children && row.children.length > 0),
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.dept.operation'),
      width: 200,
    },
  ];
}
