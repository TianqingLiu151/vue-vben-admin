<script lang="ts" setup>
import type { TaskDraft } from '../types';

import type { TodoApi } from '#/api/todo';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Checkbox,
  Drawer,
  Form,
  Input,
  Select,
  Space,
} from 'ant-design-vue';

import { priorityOptions, repeatOptions, statusOptions } from '../constants';

defineProps<{
  activeTask?: TodoApi.TodoTaskItem;
  draft: TaskDraft;
  listOptions: Array<{ label: string; value: string }>;
  saving: boolean;
  tagOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  createSubtask: [];
  deleteTask: [task: TodoApi.TodoTaskItem];
  removeSubtask: [item: TodoApi.TodoSubtaskItem];
  save: [];
  toggleSubtask: [item: TodoApi.TodoSubtaskItem];
}>();

const open = defineModel<boolean>('open', { required: true });
const newSubtaskTitle = defineModel<string>('newSubtaskTitle', {
  required: true,
});
</script>

<template>
  <Drawer v-model:open="open" destroy-on-close title="任务详情" width="520">
    <template #extra>
      <Space v-if="activeTask">
        <Button danger @click="emit('deleteTask', activeTask)">删除</Button>
        <Button :loading="saving" type="primary" @click="emit('save')">
          保存
        </Button>
      </Space>
    </template>

    <div v-if="activeTask">
      <Form layout="vertical">
        <Form.Item label="标题">
          <Input v-model:value="draft.title" />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea v-model:value="draft.description" :rows="4" />
        </Form.Item>
        <div class="todo-form-grid">
          <Form.Item label="清单">
            <Select v-model:value="draft.listId" :options="listOptions" />
          </Form.Item>
          <Form.Item label="优先级">
            <Select v-model:value="draft.priority" :options="priorityOptions" />
          </Form.Item>
          <Form.Item label="状态">
            <Select v-model:value="draft.status" :options="statusOptions" />
          </Form.Item>
          <Form.Item label="重复">
            <Select v-model:value="draft.repeatRule" :options="repeatOptions" />
          </Form.Item>
        </div>
        <div class="todo-form-grid">
          <Form.Item label="截止日期">
            <input
              v-model="draft.dueDate"
              class="todo-native-input"
              type="date"
            />
          </Form.Item>
          <Form.Item label="截止时间">
            <input
              v-model="draft.dueTime"
              class="todo-native-input"
              type="time"
            />
          </Form.Item>
        </div>
        <Form.Item label="标签">
          <Select
            v-model:value="draft.tagIds"
            mode="multiple"
            :options="tagOptions"
            placeholder="选择标签"
          />
        </Form.Item>
        <Form.Item label="提醒时间">
          <input
            v-model="draft.reminderAt"
            class="todo-native-input"
            type="datetime-local"
          />
        </Form.Item>
        <Form.Item>
          <Checkbox v-model:checked="draft.isStarred">星标任务</Checkbox>
        </Form.Item>
      </Form>

      <section class="todo-subtasks">
        <div class="todo-subtasks__header">
          <h3>子任务</h3>
          <span>
            {{ activeTask.subtaskCompleted }}/{{ activeTask.subtaskTotal }}
          </span>
        </div>
        <div class="todo-subtasks__new">
          <Input
            v-model:value="newSubtaskTitle"
            placeholder="新增子任务"
            @press-enter="emit('createSubtask')"
          />
          <Button @click="emit('createSubtask')">
            <IconifyIcon icon="lucide:plus" />
          </Button>
        </div>
        <div class="todo-subtask-list">
          <div
            v-for="item in activeTask.subtasks"
            :key="item.id"
            class="todo-subtask"
          >
            <Checkbox
              :checked="item.isCompleted"
              @change="emit('toggleSubtask', item)"
            >
              <span :class="{ 'is-completed-text': item.isCompleted }">
                {{ item.title }}
              </span>
            </Checkbox>
            <Button
              size="small"
              type="text"
              danger
              @click="emit('removeSubtask', item)"
            >
              <IconifyIcon icon="lucide:x" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  </Drawer>
</template>
