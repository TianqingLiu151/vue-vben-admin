<script lang="ts" setup>
import type { TodoResourceModalState } from '../types';

import { $t } from '@vben/locales';

import { Checkbox, Form, Input, InputNumber, Modal } from 'ant-design-vue';

const emit = defineEmits<{
  save: [];
}>();

const model = defineModel<TodoResourceModalState>({ required: true });

</script>

<template>
  <Modal
    v-model:open="model.open"
    :title="
      (model.id ? $t('todo.resourceModal.edit') : $t('todo.resourceModal.create')) +
      (model.type === 'list'
        ? $t('todo.resourceModal.list')
        : $t('todo.resourceModal.tag'))
    "
    @ok="emit('save')"
  >
    <Form layout="vertical">
      <Form.Item :label="$t('todo.resourceModal.name')">
        <Input v-model:value="model.name" />
      </Form.Item>
      <Form.Item :label="$t('todo.resourceModal.color')">
        <input v-model="model.color" class="todo-color-input" type="color" />
      </Form.Item>
      <template v-if="model.type === 'list'">
        <Form.Item :label="$t('todo.resourceModal.icon')">
          <Input
            v-model:value="model.icon"
            :placeholder="$t('todo.resourceModal.iconPlaceholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('todo.resourceModal.sortOrder')">
          <InputNumber v-model:value="model.sortOrder" class="w-full" />
        </Form.Item>
        <Form.Item>
          <Checkbox v-model:checked="model.isArchived">
            {{ $t('todo.resourceModal.archiveList') }}
          </Checkbox>
        </Form.Item>
      </template>
    </Form>
  </Modal>
</template>
