<script lang="ts" setup>
import type { SystemUserApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createUser, updateUser } from '#/api';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<SystemUserApi.SystemUser>();
const id = ref<number>();

let roleSearchTimer: number | undefined;

const [Form, formApi] = useVbenForm({
  schema: useFormSchema({
    onRoleSearch: (keyword) => {
      if (roleSearchTimer) {
        window.clearTimeout(roleSearchTimer);
      }
      roleSearchTimer = window.setTimeout(() => {
        const roleField = formApi.getFieldComponentRef<any>('roles');
        roleField?.updateParam?.({
          ...(keyword ? { roleName: keyword } : {}),
          limit: 200,
        });
      }, 300);
    },
  }),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    const roles = Array.isArray(values.roles)
      ? values.roles.filter((role: string) => !!role)
      : [];

    drawerApi.lock();
    try {
      if (id.value) {
        const payload: SystemUserApi.UserUpdate = {
          homePath: toOptionalString(values.homePath),
          realName: toOptionalString(values.realName),
          roles,
        };
        if (toOptionalString(values.password)) {
          payload.password = values.password.trim();
        }
        await updateUser(id.value, payload);
      } else {
        const username = toOptionalString(values.username);
        const password = toOptionalString(values.password);

        if (!username) {
          message.error(
            $t('ui.formRules.required', [$t('system.user.username')]),
          );
          drawerApi.unlock();
          return;
        }

        if (!password) {
          message.error(
            $t('ui.formRules.required', [$t('system.user.password')]),
          );
          drawerApi.unlock();
          return;
        }

        await createUser({
          homePath: toOptionalString(values.homePath),
          password,
          realName: toOptionalString(values.realName),
          roles,
          username,
        });
      }
      emits('success');
      drawerApi.close();
    } catch {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<SystemUserApi.SystemUser>();
      formApi.resetForm();

      if (data?.id) {
        formData.value = data;
        id.value = data.id;
      } else {
        formData.value = undefined;
        id.value = undefined;
      }

      await nextTick();
      const baseValues = data ?? ({} as SystemUserApi.SystemUser);
      formApi.setValues({
        ...baseValues,
        password: '',
        roles: data?.roles ?? [],
      });
    }
  },
});

const getDrawerTitle = computed(() => {
  return (
    (formData.value?.id &&
      $t('ui.actionTitle.edit', [$t('system.user.name')])) ||
    $t('ui.actionTitle.create', [$t('system.user.name')])
  );
});

function toOptionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
