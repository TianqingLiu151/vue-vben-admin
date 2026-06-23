<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, defineComponent, h, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { getCaptchaApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const showCaptcha = ref(false);
const captchaId = ref('');
const captchaQuestion = ref('');
const captchaLoading = ref(false);

const CaptchaRefresh = defineComponent({
  name: 'CaptchaRefresh',
  setup() {
    return () =>
      h(
        'button',
        {
          class: 'vben-link ml-2 text-xs',
          disabled: captchaLoading.value,
          type: 'button',
          onClick: loadCaptcha,
        },
        captchaLoading.value ? '刷新中...' : '刷新验证码',
      );
  },
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入验证码答案',
      },
      dependencies: {
        show: () => showCaptcha.value,
        triggerFields: ['username'],
      },
      description: () =>
        captchaQuestion.value
          ? `验证码：${captchaQuestion.value}`
          : '正在获取验证码...',
      fieldName: 'captchaAnswer',
      label: '验证码',
      rules: z.string().min(1, { message: '请输入验证码答案' }),
      suffix: CaptchaRefresh as any,
    },
  ];
});

async function loadCaptcha() {
  captchaLoading.value = true;
  try {
    const captcha = await getCaptchaApi();
    captchaId.value = captcha.captchaId;
    captchaQuestion.value = captcha.question;
  } finally {
    captchaLoading.value = false;
  }
}

function shouldShowCaptcha(error: any) {
  const status = error?.response?.status;
  const data = error?.response?.data ?? error?.data ?? {};
  const text = `${data?.message ?? ''} ${data?.detail ?? ''} ${data?.error ?? ''}`;
  return (
    status === 400 ||
    status === 401 ||
    /captcha|验证码|verification/i.test(text)
  );
}

function showLoginError(error: any) {
  const status = error?.response?.status;
  const data = error?.response?.data ?? error?.data ?? {};
  const text = data?.message ?? data?.detail ?? data?.error ?? '';

  if (status === 423) {
    const lockedUntil = data?.data?.lockedUntil
      ? `，解锁时间：${data.data.lockedUntil}`
      : '';
    message.warning(`账号已被临时锁定${lockedUntil}`);
    return;
  }

  if (status === 429) {
    message.warning('登录过于频繁，请稍后再试');
    return;
  }

  if (/captcha|验证码|verification/i.test(text)) {
    message.warning('验证码错误或已过期，请重新输入');
    return;
  }

  if (status === 401 || status === 403) {
    message.error('用户名或密码错误，或当前账号不可用');
  }
}

async function handleSubmit(values: Recordable<any>) {
  const payload = {
    password: values.password,
    username: values.username,
    ...(showCaptcha.value
      ? {
          captchaAnswer: values.captchaAnswer,
          captchaId: captchaId.value,
        }
      : {}),
  };

  try {
    await authStore.authLogin(payload);
  } catch (error) {
    if (shouldShowCaptcha(error)) {
      showCaptcha.value = true;
      await loadCaptcha();
    }
    showLoginError(error);
  }
}
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="handleSubmit"
  />
</template>
