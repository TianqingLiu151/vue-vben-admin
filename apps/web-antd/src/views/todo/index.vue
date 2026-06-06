<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { baseViews } from './constants';
import TodoDetailDrawer from './components/todo-detail-drawer.vue';
import TodoResourceModal from './components/todo-resource-modal.vue';
import TodoSidebar from './components/todo-sidebar.vue';
import TodoTaskList from './components/todo-task-list.vue';
import { useTodoPage } from './composables/use-todo-page';

const todo = useTodoPage();
</script>

<template>
  <Page auto-content-height>
    <div class="todo-shell">
      <TodoSidebar
        :base-views="baseViews"
        :current-list-id="todo.currentListId.value"
        :current-tag-id="todo.currentTagId.value"
        :is-current-view="todo.isCurrentView"
        :lists="todo.lists.value"
        :loading="todo.metaLoading.value"
        :tags="todo.tags.value"
        @delete-resource="todo.confirmDeleteResource"
        @edit-resource="todo.openResourceModal"
        @refresh="todo.reloadAll"
        @select-list="todo.navToList"
        @select-tag="todo.navToTag"
        @select-view="todo.navToView"
      />

      <TodoTaskList
        v-model:keyword="todo.keyword.value"
        v-model:page="todo.page.value"
        v-model:page-size="todo.pageSize.value"
        v-model:priority-filter="todo.priorityFilter.value"
        v-model:quick-title="todo.quickTitle.value"
        v-model:status-filter="todo.statusFilter.value"
        :active-task="todo.activeTask.value"
        :current-title="todo.currentTitle.value"
        :is-done="todo.isDone"
        :is-overdue="todo.isOverdue"
        :loading="todo.loading.value"
        :tasks="todo.tasks.value"
        :total="todo.total.value"
        @create-quick-task="todo.createQuickTask"
        @delete-task="todo.confirmDeleteTask"
        @open-task="todo.openTask"
        @refresh="todo.loadTasks"
        @reset-filters="todo.resetFilters"
        @toggle-complete="todo.toggleComplete"
        @toggle-star="todo.toggleStar"
      />
    </div>

    <TodoDetailDrawer
      v-model:new-subtask-title="todo.newSubtaskTitle.value"
      v-model:open="todo.detailOpen.value"
      :active-task="todo.activeTask.value"
      :draft="todo.draft"
      :list-options="todo.listOptions.value"
      :saving="todo.saving.value"
      :tag-options="todo.tagOptions.value"
      @create-subtask="todo.createSubtask"
      @delete-task="todo.confirmDeleteTask"
      @remove-subtask="todo.removeSubtask"
      @save="todo.saveTaskDetail"
      @toggle-subtask="todo.toggleSubtask"
    />

    <TodoResourceModal v-model="todo.resourceModal" @save="todo.saveResource" />
  </Page>
</template>

<style>
.todo-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: calc(100vh - 120px);
  overflow: hidden;
  background: hsl(var(--background));
}

.todo-sidebar {
  border-right: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  padding: 18px 14px;
}

.todo-sidebar__header,
.todo-main__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.todo-sidebar__header h1,
.todo-main__header h2 {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 22px;
  font-weight: 650;
  line-height: 1.25;
}

.todo-kicker {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 1.5;
}

.todo-nav-section {
  margin-top: 22px;
}

.todo-nav-section__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 8px;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  font-weight: 600;
}

.todo-nav {
  display: grid;
  gap: 4px;
}

.todo-nav__item,
.todo-nav__row,
.todo-nav__row > button {
  min-height: 36px;
  border: 0;
  background: transparent;
}

.todo-nav__item,
.todo-nav__row > button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  color: hsl(var(--foreground));
  cursor: pointer;
  font-size: 14px;
  text-align: left;
}

.todo-nav__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  border-radius: 8px;
}

.todo-nav__item:hover,
.todo-nav__row:hover,
.todo-nav__item.is-active,
.todo-nav__row.is-active {
  background: hsl(var(--accent));
}

.todo-dot {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 50%;
}

.todo-main {
  min-width: 0;
  padding: 22px;
}

.todo-quick,
.todo-filter {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.todo-filter {
  flex-wrap: wrap;
}

.todo-filter .ant-select {
  width: 150px;
}

.todo-filter__keyword {
  max-width: 320px;
}

.todo-list {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.todo-task {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  padding: 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
  cursor: pointer;
}

.todo-task:hover,
.todo-task.is-selected {
  border-color: hsl(var(--primary));
}

.todo-task.is-completed {
  opacity: 0.68;
}

.todo-task__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  color: hsl(var(--primary));
  cursor: pointer;
}

.todo-task__content {
  min-width: 0;
}

.todo-task__title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: hsl(var(--foreground));
  font-weight: 600;
}

.todo-task__title span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-task__meta,
.todo-task__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.todo-task__meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.todo-task__meta .is-overdue {
  color: #dc2626;
}

.todo-task__actions {
  opacity: 0.75;
}

.todo-empty {
  margin-top: 80px;
}

.todo-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.todo-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.todo-native-input {
  width: 100%;
  height: 32px;
  padding: 4px 11px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.todo-subtasks {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid hsl(var(--border));
}

.todo-subtasks__header,
.todo-subtask {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.todo-subtasks__header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.todo-subtasks__new {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.todo-subtask-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.is-completed-text {
  color: hsl(var(--muted-foreground));
  text-decoration: line-through;
}

.todo-color-input {
  width: 48px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
}

@media (max-width: 900px) {
  .todo-shell {
    grid-template-columns: 1fr;
  }

  .todo-sidebar {
    border-right: 0;
    border-bottom: 1px solid hsl(var(--border));
  }
}

@media (max-width: 640px) {
  .todo-main {
    padding: 16px;
  }

  .todo-quick,
  .todo-filter,
  .todo-form-grid {
    grid-template-columns: 1fr;
  }

  .todo-task {
    grid-template-columns: 30px minmax(0, 1fr);
  }

  .todo-task__actions {
    grid-column: 2;
  }
}
</style>
