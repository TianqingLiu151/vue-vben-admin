import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ProductTableApi } from '#/api';

import { z } from '#/adapter/form';

const statusOptions = [
  { color: 'success', label: 'Success', value: 'success' },
  { color: 'warning', label: 'Pending', value: 'pending' },
  { color: 'error', label: 'Error', value: 'error' },
  { color: 'processing', label: 'Processing', value: 'processing' },
];

const categoryOptions = [
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Books', value: 'Books' },
  { label: 'Clothing', value: 'Clothing' },
  { label: 'Home', value: 'Home' },
  { label: 'Sports', value: 'Sports' },
];

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'productName',
      label: '商品名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: categoryOptions,
      },
      fieldName: 'category',
      label: '分类',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: statusOptions,
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'productName',
      label: '商品名称',
      rules: z.string().min(1, '请输入商品名称'),
    },
    {
      component: 'Select',
      componentProps: {
        options: categoryOptions,
      },
      fieldName: 'category',
      label: '分类',
    },
    {
      component: 'Select',
      componentProps: {
        options: statusOptions,
      },
      defaultValue: 'success',
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
      },
      fieldName: 'price',
      label: '价格',
    },
    {
      component: 'Input',
      defaultValue: 'USD',
      fieldName: 'currency',
      label: '币种',
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 0,
      },
      fieldName: 'quantity',
      label: '库存',
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        max: 5,
        min: 0,
        precision: 1,
      },
      fieldName: 'rating',
      label: '评分',
    },
    {
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        showTime: true,
        valueFormat: 'YYYY-MM-DDTHH:mm:ss',
      },
      fieldName: 'releaseDate',
      label: '发布日期',
    },
    {
      component: 'Input',
      fieldName: 'imageUrl',
      label: '图片 URL',
    },
    {
      component: 'Input',
      fieldName: 'imageUrl2',
      label: '备用图片 URL',
    },
    {
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
      },
      fieldName: 'weight',
      label: '重量',
    },
    {
      component: 'Input',
      fieldName: 'color',
      label: '颜色',
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'tags',
        options: [],
      },
      fieldName: 'tags',
      label: '标签',
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'isOpen',
      label: '公开',
    },
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'available',
      label: '可用',
    },
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'inProduction',
      label: '生产中',
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
      },
      fieldName: 'description',
      formItemClass: 'col-span-2',
      label: '描述',
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<ProductTableApi.Product>,
): VxeTableGridColumns<ProductTableApi.Product> {
  return [
    {
      field: 'productName',
      fixed: 'left',
      minWidth: 220,
      title: '商品名称',
    },
    {
      field: 'category',
      title: '分类',
      width: 140,
    },
    {
      field: 'price',
      formatter: ({ row }) =>
        row.price === undefined
          ? ''
          : `${row.currency ?? 'USD'} ${Number(row.price).toFixed(2)}`,
      title: '价格',
      width: 140,
    },
    {
      field: 'quantity',
      title: '库存',
      width: 100,
    },
    {
      cellRender: { name: 'CellTag', options: statusOptions },
      field: 'status',
      title: '状态',
      width: 120,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '是', value: true },
          { color: 'error', label: '否', value: false },
        ],
      },
      field: 'available',
      title: '可用',
      width: 100,
    },
    {
      field: 'rating',
      title: '评分',
      width: 100,
    },
    {
      field: 'releaseDate',
      title: '发布日期',
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'productName',
          nameTitle: '商品',
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 140,
    },
  ];
}
