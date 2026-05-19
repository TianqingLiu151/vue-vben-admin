<script lang="ts" setup>
import type { ProductTableApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createTableItem, updateTableItem } from '#/api';

import { useFormSchema } from '../data';

const emit = defineEmits<{
  success: [];
}>();

const formData = ref<ProductTableApi.Product>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<ProductTableApi.ProductPayload>();
    const payload: ProductTableApi.ProductPayload = {
      ...values,
      available: values.available ?? false,
      inProduction: values.inProduction ?? false,
      isOpen: values.isOpen ?? false,
      status: values.status ?? 'success',
      tags: Array.isArray(values.tags) ? values.tags : [],
    };

    drawerApi.lock();
    try {
      await (formData.value?.id ? updateTableItem(formData.value.id, payload) : createTableItem(payload));
      drawerApi.close();
      emit('success');
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<ProductTableApi.Product>();
    formData.value = data?.id ? data : undefined;
    formApi.resetForm();
    await nextTick();
    formApi.setValues({
      ...data,
      available: data?.available ?? true,
      inProduction: data?.inProduction ?? true,
      isOpen: data?.isOpen ?? false,
      status: data?.status ?? 'success',
      tags: data?.tags ?? [],
    });
  },
});

const title = computed(() => (formData.value?.id ? '编辑商品' : '新增商品'));
</script>

<template>
  <Drawer class="w-full max-w-200" :title="title">
    <Form class="mx-4" />
  </Drawer>
</template>
