<script lang="ts" setup>
import type { NavView, ResourceType, TodoNavView } from '../types';

import type { TodoApi } from '#/api/todo';

import { IconifyIcon } from '@vben/icons';

import { Button, Space, Spin, Tooltip } from 'ant-design-vue';

defineProps<{
  baseViews: TodoNavView[];
  currentListId?: string;
  currentTagId?: string;
  isCurrentView: (key: NavView) => boolean;
  lists: TodoApi.TodoListItem[];
  loading: boolean;
  tags: TodoApi.TodoTagItem[];
}>();

const emit = defineEmits<{
  deleteResource: [
    type: ResourceType,
    item: TodoApi.TodoListItem | TodoApi.TodoTagItem,
  ];
  editResource: [
    type: ResourceType,
    item?: TodoApi.TodoListItem | TodoApi.TodoTagItem,
  ];
  refresh: [];
  selectList: [id: string];
  selectTag: [id: string];
  selectView: [view: NavView];
}>();
</script>

<template>
  <aside class="todo-sidebar">
    <div class="todo-sidebar__header">
      <div>
        <div class="todo-kicker">Personal</div>
        <h1>待办</h1>
      </div>
      <Tooltip title="刷新">
        <Button size="small" type="text" @click="emit('refresh')">
          <IconifyIcon icon="lucide:refresh-cw" />
        </Button>
      </Tooltip>
    </div>

    <Spin :spinning="loading">
      <div class="todo-nav">
        <button
          v-for="item in baseViews"
          :key="item.key"
          class="todo-nav__item"
          :class="{ 'is-active': isCurrentView(item.key) }"
          type="button"
          @click="emit('selectView', item.key)"
        >
          <IconifyIcon :icon="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </div>

      <section class="todo-nav-section">
        <div class="todo-nav-section__title">
          <span>清单</span>
          <Button
            size="small"
            type="text"
            @click="emit('editResource', 'list')"
          >
            <IconifyIcon icon="lucide:plus" />
          </Button>
        </div>
        <div class="todo-nav">
          <div
            v-for="item in lists"
            :key="item.id"
            class="todo-nav__row"
            :class="{ 'is-active': currentListId === item.id }"
          >
            <button type="button" @click="emit('selectList', item.id)">
              <span
                class="todo-dot"
                :style="{ background: item.color || '#1677ff' }"
              ></span>
              <span>{{ item.name }}</span>
            </button>
            <Space :size="2">
              <Button
                size="small"
                type="text"
                @click.stop="emit('editResource', 'list', item)"
              >
                <IconifyIcon icon="lucide:pencil" />
              </Button>
              <Button
                size="small"
                type="text"
                danger
                @click.stop="emit('deleteResource', 'list', item)"
              >
                <IconifyIcon icon="lucide:trash-2" />
              </Button>
            </Space>
          </div>
        </div>
      </section>

      <section class="todo-nav-section">
        <div class="todo-nav-section__title">
          <span>标签</span>
          <Button size="small" type="text" @click="emit('editResource', 'tag')">
            <IconifyIcon icon="lucide:plus" />
          </Button>
        </div>
        <div class="todo-nav">
          <div
            v-for="item in tags"
            :key="item.id"
            class="todo-nav__row"
            :class="{ 'is-active': currentTagId === item.id }"
          >
            <button type="button" @click="emit('selectTag', item.id)">
              <span
                class="todo-dot"
                :style="{ background: item.color || '#0f766e' }"
              ></span>
              <span>{{ item.name }}</span>
            </button>
            <Space :size="2">
              <Button
                size="small"
                type="text"
                @click.stop="emit('editResource', 'tag', item)"
              >
                <IconifyIcon icon="lucide:pencil" />
              </Button>
              <Button
                size="small"
                type="text"
                danger
                @click.stop="emit('deleteResource', 'tag', item)"
              >
                <IconifyIcon icon="lucide:trash-2" />
              </Button>
            </Space>
          </div>
        </div>
      </section>
    </Spin>
  </aside>
</template>
