<script lang="ts" setup>
import type { TodoResourceModalState } from '../types';

import { Checkbox, Form, Input, InputNumber, Modal } from 'ant-design-vue';

const emit = defineEmits<{
  save: [];
}>();

const model = defineModel<TodoResourceModalState>({ required: true });

</script>

<template>
  <Modal
    v-model:open="model.open"
    :title="`${model.id ? '编辑' : '新建'}${model.type === 'list' ? '清单' : '标签'}`"
    @ok="emit('save')"
  >
    <Form layout="vertical">
      <Form.Item label="名称">
        <Input v-model:value="model.name" />
      </Form.Item>
      <Form.Item label="颜色">
        <input v-model="model.color" class="todo-color-input" type="color" />
      </Form.Item>
      <template v-if="model.type === 'list'">
        <Form.Item label="图标">
          <Input v-model:value="model.icon" placeholder="lucide:list" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber v-model:value="model.sortOrder" class="w-full" />
        </Form.Item>
        <Form.Item>
          <Checkbox v-model:checked="model.isArchived">归档清单</Checkbox>
        </Form.Item>
      </template>
    </Form>
  </Modal>
</template>
