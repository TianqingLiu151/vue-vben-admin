<script lang="ts" setup>
import type { TodoApi } from '#/api/todo';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Empty,
  Input,
  Pagination,
  Select,
  Space,
  Spin,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { colorOfPriority, priorityOptions, statusOptions } from '../constants';

defineProps<{
  activeTask?: TodoApi.TodoTaskItem;
  currentTitle: string;
  isDone: (task: TodoApi.TodoTaskItem) => boolean;
  isOverdue: (task: TodoApi.TodoTaskItem) => boolean;
  loading: boolean;
  tasks: TodoApi.TodoTaskItem[];
  total: number;
}>();

const emit = defineEmits<{
  createQuickTask: [];
  deleteTask: [task: TodoApi.TodoTaskItem];
  openTask: [task: TodoApi.TodoTaskItem];
  refresh: [];
  resetFilters: [];
  toggleComplete: [task: TodoApi.TodoTaskItem];
  toggleStar: [task: TodoApi.TodoTaskItem];
}>();

const quickTitle = defineModel<string>('quickTitle', { required: true });
const keyword = defineModel<string>('keyword', { required: true });
const statusFilter = defineModel<string | undefined>('statusFilter');
const priorityFilter = defineModel<number | undefined>('priorityFilter');
const page = defineModel<number>('page', { required: true });
const pageSize = defineModel<number>('pageSize', { required: true });

function formatDate(value?: string) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '';
}
</script>

<template>
  <main class="todo-main">
    <div class="todo-main__header">
      <div>
        <div class="todo-kicker">{{ total }} items</div>
        <h2>{{ currentTitle }}</h2>
      </div>
      <Button @click="emit('refresh')">
        <IconifyIcon icon="lucide:rotate-cw" />
        刷新
      </Button>
    </div>

    <div class="todo-quick">
      <Input
        v-model:value="quickTitle"
        allow-clear
        placeholder="输入任务，回车创建"
        @press-enter="emit('createQuickTask')"
      />
      <Button type="primary" @click="emit('createQuickTask')">
        <IconifyIcon icon="lucide:plus" />
        新建
      </Button>
    </div>

    <div class="todo-filter">
      <Input
        v-model:value="keyword"
        allow-clear
        class="todo-filter__keyword"
        placeholder="关键词"
        @press-enter="emit('refresh')"
      />
      <Select
        v-model:value="statusFilter"
        allow-clear
        :options="statusOptions"
        placeholder="状态"
        @change="emit('refresh')"
      />
      <Select
        v-model:value="priorityFilter"
        allow-clear
        :options="priorityOptions"
        placeholder="优先级"
        @change="emit('refresh')"
      />
      <Button @click="emit('resetFilters')">重置</Button>
    </div>

    <Spin :spinning="loading">
      <div v-if="tasks.length > 0" class="todo-list">
        <article
          v-for="task in tasks"
          :key="task.id"
          class="todo-task"
          :class="{
            'is-completed': isDone(task),
            'is-selected': activeTask?.id === task.id,
          }"
          @click="emit('openTask', task)"
        >
          <button
            class="todo-task__check"
            type="button"
            @click.stop="emit('toggleComplete', task)"
          >
            <IconifyIcon
              :icon="isDone(task) ? 'lucide:check-circle-2' : 'lucide:circle'"
            />
          </button>
          <div class="todo-task__content">
            <div class="todo-task__title">
              <span>{{ task.title }}</span>
              <Tag :color="colorOfPriority(task.priority)">
                P{{ task.priority }}
              </Tag>
            </div>
            <div class="todo-task__meta">
              <span
                v-if="task.dueDate"
                :class="{ 'is-overdue': isOverdue(task) }"
              >
                <IconifyIcon icon="lucide:calendar" />
                {{ formatDate(task.dueDate) }} {{ task.dueTime?.slice(0, 5) }}
              </span>
              <span v-if="task.listName">
                <IconifyIcon icon="lucide:list" />
                {{ task.listName }}
              </span>
              <span v-if="task.subtaskTotal">
                <IconifyIcon icon="lucide:list-checks" />
                {{ task.subtaskCompleted }}/{{ task.subtaskTotal }}
              </span>
            </div>
            <div v-if="task.tags.length > 0" class="todo-task__tags">
              <Tag
                v-for="tag in task.tags"
                :key="tag.id"
                :color="tag.color || 'default'"
              >
                {{ tag.name }}
              </Tag>
            </div>
          </div>
          <Space class="todo-task__actions">
            <Button
              size="small"
              type="text"
              @click.stop="emit('toggleStar', task)"
            >
              <IconifyIcon
                :icon="task.isStarred ? 'lucide:star' : 'lucide:star-off'"
              />
            </Button>
            <Button
              size="small"
              type="text"
              danger
              @click.stop="emit('deleteTask', task)"
            >
              <IconifyIcon icon="lucide:trash-2" />
            </Button>
          </Space>
        </article>
      </div>
      <Empty v-else class="todo-empty" description="暂无待办" />
    </Spin>

    <div class="todo-pagination">
      <Pagination
        v-model:current="page"
        v-model:page-size="pageSize"
        show-size-changer
        :total="total"
        @change="emit('refresh')"
      />
    </div>
  </main>
</template>
