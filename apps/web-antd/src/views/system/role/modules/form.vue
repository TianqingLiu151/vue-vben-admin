<script lang="ts" setup>
import type { DataNode } from 'ant-design-vue/es/tree';

import type { Recordable } from '@vben/types';

import type { SystemRoleApi } from '#/api/system/role';

import { computed, nextTick, ref } from 'vue';

import { Tree, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Spin } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getMenuList } from '#/api/system/menu';
import { createRole, updateRole } from '#/api/system/role';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<SystemRoleApi.SystemRole>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema({
    onDataScopeChange: (dataScope) => {
      if (dataScope !== 'custom') {
        formApi.setValues({ deptIds: [] });
      }
    },
  }),
  showDefaultActions: false,
});

const menuTree = ref<DataNode[]>([]);
const loadingMenuTree = ref(false);

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    const dataScope = values.dataScope ?? 'self';
    const payload = {
      code: values.code,
      dataScope,
      deptIds: dataScope === 'custom' ? (values.deptIds ?? []) : [],
      menuIds: values.menuIds ?? [],
      name: values.name,
      remark: values.remark,
      status: values.status ?? 1,
    };
    drawerApi.lock();
    (id.value
      ? updateRole(id.value, payload as any)
      : createRole(payload as any)
    )
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch((error) => {
        showDataScopeError(error);
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<SystemRoleApi.SystemRole>();
      formApi.resetForm();

      if (data) {
        formData.value = data;
        id.value = data.id;
      } else {
        id.value = undefined;
      }

      if (menuTree.value.length === 0) {
        await loadMenuTree();
      }
      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();
      if (data) {
        formApi.setValues({
          ...data,
          dataScope: data.dataScope ?? 'self',
          deptIds: data.deptIds ?? [],
          menuIds: data.menuIds ?? [],
        });
      } else {
        formApi.setValues({
          dataScope: 'self',
          deptIds: [],
          status: 1,
        });
      }
    }
  },
});

async function loadMenuTree() {
  loadingMenuTree.value = true;
  try {
    const res = await getMenuList();
    menuTree.value = res as unknown as DataNode[];
  } finally {
    loadingMenuTree.value = false;
  }
}

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('system.role.name'))
    : $t('common.create', $t('system.role.name'));
});

function getNodeClass(node: Recordable<any>) {
  const classes: string[] = [];
  if (node.value?.type === 'button') {
    classes.push('inline-flex');
  }

  return classes.join(' ');
}

function showDataScopeError(error?: any) {
  const status = error?.response?.status;
  const responseData = error?.response?.data ?? error?.data ?? error ?? {};
  const errorMessage = responseData?.message ?? responseData?.error ?? '';

  if (status === 403 && errorMessage.includes('all')) {
    message.error('只有超级管理员可以授予全部数据范围');
  } else if (
    status === 403 &&
    errorMessage.includes('Cannot assign a department')
  ) {
    message.error('不能分配无权访问的部门');
  } else if (status === 400 && errorMessage.includes('Unknown department')) {
    message.error('部门不存在或已被删除，请刷新后重新选择');
  }
}
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form>
      <template #menuIds="slotProps">
        <Spin :spinning="loadingMenuTree" wrapper-class-name="w-full">
          <Tree
            :tree-data="menuTree"
            multiple
            bordered
            :default-expanded-level="2"
            :get-node-class="getNodeClass"
            v-bind="slotProps"
            value-field="id"
            label-field="meta.title"
            icon-field="meta.icon"
          >
            <template #node="{ value }">
              <IconifyIcon v-if="value.meta.icon" :icon="value.meta.icon" />
              {{ $t(value.meta.title) }}
            </template>
          </Tree>
        </Spin>
      </template>
    </Form>
  </Drawer>
</template>
<style lang="css" scoped>
:deep(.ant-tree-title) {
  .tree-actions {
    @apply ml-5 hidden;
  }
}

:deep(.ant-tree-title:hover) {
  .tree-actions {
    @apply ml-5 flex flex-auto justify-end;
  }
}
</style>
