<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ElButton, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteUser, getUserList } from '#/api';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  // 关联的表单组件
  connectedComponent: Form,
  // 关闭时销毁组件
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  // 搜索表单配置
  formOptions: {
    schema: useGridFormSchema(),
    // 值改变时自动提交搜索
    submitOnChange: true,
  },
  // 表格配置
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        // 数据查询接口
        query: async ({ page }, formValues) => {
          return await getUserList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },

    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<SystemUserApi.SystemUser>,
});

/**
 * 处理表格操作列点击事件
 * @param e 操作列点击参数（包含操作类型 code 和当前行数据 row）
 */
function onActionClick(e: OnActionClickParams<SystemUserApi.SystemUser>) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      onEdit(e.row);
      break;
    }
  }
}

/**
 * 编辑用户：将当前行数据设置到表单并打开弹窗
 * @param row 当前用户数据
 */
function onEdit(row: SystemUserApi.SystemUser) {
  formDrawerApi.setData(row).open();
}

/**
 * 删除用户：二次确认后调用删除接口并刷新列表
 * @param row 当前用户数据
 */
function onDelete(row: SystemUserApi.SystemUser) {
  ElMessageBox.confirm(`确认删除用户 \${row.username} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const loadingMsg = ElMessage({
        message: '正在删除...',
        duration: 0,
        type: 'info',
      });
      deleteUser(row.id)
        .then(() => {
          ElMessage.success('删除成功');
          onRefresh();
        })
        .finally(() => {
          loadingMsg.close();
        });
    })
    .catch(() => {});
}

/**
 * 刷新表格数据
 */
function onRefresh() {
  gridApi.query();
}

/**
 * 新增用户：重置表单数据并打开弹窗
 */
function onCreate() {
  formDrawerApi.setData({}).open();
}
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid table-title="用户列表">
      <template #toolbar-tools>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增用户
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
