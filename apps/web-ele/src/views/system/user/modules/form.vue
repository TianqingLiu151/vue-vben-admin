<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createUser, updateUser } from '#/api/system/user';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

// 存储当前编辑的用户数据
const formData = ref<SystemUserApi.SystemUser>();
// 当前编辑用户的ID（若为空则表示新增）
const id = ref();

const [Form, formApi] = useVbenForm({
  // 获取表单结构配置
  schema: useFormSchema(),
  // 隐藏默认底部的操作按钮，交由弹窗统一控制
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  /**
   * 弹窗确认按钮点击事件
   * 负责验证表单数据、处理密码字段逻辑，并调用新增或更新接口
   */
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    
    // 如果是编辑模式且未修改密码，则从提交数据中剔除密码字段
    if (id.value && !values.password) {
      delete values.password;
    }
    
    // 如果是新增模式且未填写密码，则提示错误并拦截提交
    if (!id.value && !values.password) {
      ElMessage.warning('创建用户时密码必填');
      return;
    }

    // 锁定弹窗确认按钮防止重复提交
    drawerApi.lock();
    (id.value ? updateUser(id.value, values) : createUser(values))
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        // 请求失败后解除锁定
        drawerApi.unlock();
      });
  },

  /**
   * 弹窗打开/关闭状态变化事件
   * 用于在弹窗打开时回填表单数据并处理表单状态
   */
  async onOpenChange(isOpen) {
    if (isOpen) {
      // 获取通过 setData 传递过来的数据
      const data = drawerApi.getData<SystemUserApi.SystemUser>();
      // 打开时重置表单状态
      formApi.resetForm();

      if (data) {
        formData.value = data;
        id.value = data.id;
      } else {
        id.value = undefined;
      }

      await nextTick();
      if (data) {
        // 密码不直接回显，确保安全性及提示修改逻辑正确运行
        formApi.setValues({ ...data, password: '' });
      }
    }
  },
});

/**
 * 动态计算弹窗标题：有 ID 时为编辑，否则为创建
 */
const getDrawerTitle = computed(() => {
  return formData.value?.id ? '编辑用户' : '创建用户';
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
