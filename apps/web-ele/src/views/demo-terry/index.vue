<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { ElButton, ElCard, ElDivider, ElMessage, ElTag } from 'element-plus';

import { useVbenForm } from '#/adapter/form';

const departmental_design = 'design';
const departmental_react = 'react';

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  wrapperClass: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  handleSubmit: () => {
    ElMessage.success({
      message: '数据已成功提交到控制台',
      duration: 3000,
      showClose: true,
    });
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'username',
      label: '用户名',
      rules: 'required',
      help: '请输入您的真实姓名或昵称',
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: '邮箱地址',
      rules: 'required|email',
      componentProps: {
        placeholder: 'example@vben.com',
      },
    },
    {
      component: 'Select',
      fieldName: 'department',
      label: '所属部门',
      componentProps: {
        options: [
          { label: '研发部', value: 'rd' },
          { label: '市场部', value: 'marketing' },
          { label: '设计部', value: departmental_design },
          { label: '运营部', value: 'operation' },
        ],
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'joinDate',
      label: '入职日期',
    },
    {
      component: 'RadioGroup',
      fieldName: 'status',
      label: '目前状态',
      defaultValue: 'online',
      componentProps: {
        options: [
          { label: '在线', value: 'online' },
          { label: '离线', value: 'offline' },
          { label: '忙碌', value: 'busy' },
        ],
      },
    },
    {
      component: 'CheckboxGroup',
      fieldName: 'skills',
      label: '技能标签',
      componentProps: {
        options: [
          { label: 'Vue', value: 'vue' },
          { label: 'React', value: departmental_react },
          { label: 'TypeScript', value: 'ts' },
          { label: 'Node.js', value: 'node' },
        ],
      },
    },
  ],
});

function handleHello() {
  ElMessage({
    message: '你好，Terry！欢迎使用 Vben Admin。',
    type: 'success',
    plain: true,
  });
}

function handleReset() {
  formApi.resetForm();
  ElMessage.info('表单已重置');
}
</script>

<template>
  <Page
    description="这是一个由 Antigravity 生成的演示页面，包含了一个漂亮的表单和一些交互组件。"
    title="Terry 的演示页面"
  >
    <div class="p-4">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧表单部分 -->
        <ElCard
          class="lg:col-span-2 shadow-sm rounded-xl border-none transition-all hover:shadow-md"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <span
                class="text-xl font-bold text-gray-800 dark:text-gray-100 italic"
                >用户信息设置
              </span>
              <ElTag effect="dark" round type="primary">编辑中</ElTag>
            </div>
          </template>

          <Form />

          <ElDivider content-position="left">操作确认</ElDivider>

          <div class="flex justify-end gap-3 px-4 pb-4">
            <ElButton @click="handleReset">重置页面</ElButton>
            <ElButton type="primary" @click="() => formApi.submitForm()">
              提交数据
            </ElButton>
          </div>
        </ElCard>

        <!-- 右侧信息/操作部分 -->
        <div class="flex flex-col gap-6">
          <ElCard
            class="shadow-sm rounded-xl border-none transition-all hover:shadow-md"
          >
            <template #header>
              <span class="font-semibold">快速操作</span>
            </template>
            <div class="flex flex-col gap-3">
              <ElButton
                class="w-full !justify-start"
                type="success"
                plain
                @click="handleHello"
              >
                打个招呼
              </ElButton>
              <ElButton class="w-full !justify-start" type="warning" plain>
                发送通知
              </ElButton>
              <ElButton class="w-full !justify-start" type="danger" plain>
                危急操作
              </ElButton>
            </div>
          </ElCard>

          <ElCard
            class="shadow-sm rounded-xl border-none transition-all hover:shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900"
          >
            <template #header>
              <span class="font-semibold">使用指南</span>
            </template>
            <ul class="text-sm space-y-2 text-gray-600 dark:text-gray-400">
              <li>• 填写左侧表单以更新您的个人资料</li>
              <li>• 点击“提交数据”以在控制台查看结果</li>
              <li>• 本页面使用了 Element Plus 和 Vben Form 组件</li>
              <li>• 支持响应式布局，可在不同屏幕尺寸下良好运行</li>
            </ul>
          </ElCard>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.el-card__header) {
  border-bottom: 1px solid rgb(0 0 0 / 5%);
}

.italic {
  font-style: italic;
}
</style>
