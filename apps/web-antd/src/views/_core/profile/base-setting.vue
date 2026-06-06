<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, ref } from 'vue';

import { ProfileBaseSetting, z } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { getUserInfoApi, updateUserProfileApi } from '#/api';

const profileBaseSettingRef = ref();
const userStore = useUserStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'username',
      component: 'Input',
      label: '用户名',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'realName',
      component: 'Input',
      label: '昵称',
      rules: z.string().max(100, '昵称最多 100 个字符').optional(),
    },
    {
      fieldName: 'homePath',
      component: 'Input',
      label: '登录首页',
      componentProps: {
        placeholder: '例如 /dashboard/workspace',
      },
      rules: z.string().optional(),
    },
  ];
});

onMounted(async () => {
  const data = await getUserInfoApi();
  profileBaseSettingRef.value.getFormApi().setValues(data);
});

async function handleSubmit(values: Recordable<any>) {
  const data = await updateUserProfileApi({
    homePath: values.homePath,
    realName: values.realName,
  });

  userStore.setUserInfo(data);
  profileBaseSettingRef.value.getFormApi().setValues(data);
  message.success('保存成功');
}
</script>
<template>
  <ProfileBaseSetting
    ref="profileBaseSettingRef"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
