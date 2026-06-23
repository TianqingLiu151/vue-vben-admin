import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const FORCE_CHANGE_PASSWORD_PATH = '/auth/force-change-password';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;

    try {
      loginLoading.value = true;
      const loginResult = await loginApi(params);
      const {
        accessToken,
        expiresIn,
        mustChangePassword,
        refreshExpiresIn,
        refreshToken,
      } = loginResult;

      if (accessToken) {
        accessStore.setTokenPayload({
          accessToken,
          expiresIn,
          mustChangePassword,
          refreshExpiresIn,
          refreshToken,
        });

        if (mustChangePassword) {
          userInfo = await fetchUserInfo();
        } else {
          const [fetchUserInfoResult, accessCodes] = await Promise.all([
            fetchUserInfo(),
            getAccessCodesApi(),
          ]);
          userInfo = fetchUserInfoResult;
          userStore.setUserInfo(userInfo);
          accessStore.setAccessCodes(accessCodes);
        }

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else if (mustChangePassword) {
          await router.replace(FORCE_CHANGE_PASSWORD_PATH);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName && !mustChangePassword) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  const isLoggingOut = ref(false);

  async function logout(redirect: boolean = true) {
    if (isLoggingOut.value) return;
    isLoggingOut.value = true;

    try {
      await logoutApi();
    } catch {
      // Logout must clear local state even if the server rejects the request.
    } finally {
      isLoggingOut.value = false;
      resetAllStores();
      accessStore.setLoginExpired(false);
      accessStore.setMustChangePassword(false);
    }

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
