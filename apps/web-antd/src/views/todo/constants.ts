import type { TodoNavView } from './types';

import { computed } from 'vue';

import { $t } from '@vben/locales';

export const baseViews = computed<TodoNavView[]>(() => [
  { icon: 'lucide:inbox', key: 'inbox', label: $t('todo.views.inbox') },
  { icon: 'lucide:sun', key: 'today', label: $t('todo.views.today') },
  {
    icon: 'lucide:calendar-days',
    key: 'planned',
    label: $t('todo.views.planned'),
  },
  {
    icon: 'lucide:check-check',
    key: 'completed',
    label: $t('todo.views.completed'),
  },
]);

export const priorityOptions = computed(() => [
  { label: $t('todo.priority.p1'), value: 1 },
  { label: $t('todo.priority.p2'), value: 2 },
  { label: $t('todo.priority.p3'), value: 3 },
  { label: $t('todo.priority.p4'), value: 4 },
]);

export const statusOptions = computed(() => [
  { label: $t('todo.status.todo'), value: 'todo' },
  { label: $t('todo.status.doing'), value: 'doing' },
  { label: $t('todo.status.done'), value: 'completed' },
  { label: $t('todo.status.cancelled'), value: 'cancelled' },
]);

export const repeatOptions = computed(() => [
  { label: $t('todo.repeat.none'), value: '' },
  { label: $t('todo.repeat.daily'), value: 'daily' },
  { label: $t('todo.repeat.weekdays'), value: 'weekdays' },
  { label: $t('todo.repeat.weekly'), value: 'weekly' },
  { label: $t('todo.repeat.monthly'), value: 'monthly' },
  { label: $t('todo.repeat.yearly'), value: 'yearly' },
  { label: $t('todo.repeat.every3Days'), value: 'every:3' },
]);

export function colorOfPriority(priority: number) {
  return (
    {
      1: '#dc2626',
      2: '#ea580c',
      3: '#2563eb',
      4: '#64748b',
    }[priority] ?? '#64748b'
  );
}
