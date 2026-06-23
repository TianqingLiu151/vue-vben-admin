<script setup lang="ts">
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, ref } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { updateUserPasswordApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'ForceChangePassword' });

const authStore = useAuthStore();
const accessStore = useAccessStore();
const formRef = ref();

const passwordTip =
  '密码至少 8 位，并包含大小写字母、数字、特殊字符中的至少 3 类。';

function isStrongPassword(value: string) {
  const groups = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

  return value.length >= 8 && value.length <= 128 && groups >= 3;
}

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: '请输入当前密码',
      },
      fieldName: 'oldPassword',
      label: '当前密码',
      rules: z.string().min(1, { message: '请输入当前密码' }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码',
      },
      description: passwordTip,
      fieldName: 'newPassword',
      label: '新密码',
      rules: z.string().refine(isStrongPassword, {
        message: passwordTip,
      }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: '请再次输入新密码',
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: '请再次输入新密码' })
            .min(1, { message: '请再次输入新密码' })
            .refine((value) => value === newPassword, {
              message: '两次输入的新密码不一致',
            });
        },
        triggerFields: ['newPassword'],
      },
      fieldName: 'confirmPassword',
      label: '确认密码',
    },
  ];
});

async function handleSubmit(values: Recordable<any>) {
  await updateUserPasswordApi({
    newPassword: values.newPassword,
    oldPassword: values.oldPassword,
  });
  await formRef.value?.getFormApi().resetForm();
  accessStore.setMustChangePassword(false);
  message.success('密码修改成功，请使用新密码重新登录');
  await authStore.logout(false);
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold">修改密码</h1>
      <p class="text-muted-foreground mt-2 text-sm">
        当前账号需要先修改密码，完成后请重新登录。
      </p>
    </div>
    <ProfilePasswordSetting
      ref="formRef"
      :form-schema="formSchema"
      @submit="handleSubmit"
    />
  </div>
</template>
