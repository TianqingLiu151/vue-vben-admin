import type { TodoNavView } from './types';

export const baseViews: TodoNavView[] = [
  { icon: 'lucide:inbox', key: 'inbox', label: '收件箱' },
  { icon: 'lucide:sun', key: 'today', label: '今日' },
  { icon: 'lucide:calendar-days', key: 'planned', label: '计划' },
  { icon: 'lucide:check-check', key: 'completed', label: '已完成' },
];

export const priorityOptions = [
  { label: 'P1 高', value: 1 },
  { label: 'P2 中高', value: 2 },
  { label: 'P3 普通', value: 3 },
  { label: 'P4 低', value: 4 },
];

export const statusOptions = [
  { label: '待办', value: 'todo' },
  { label: '进行中', value: 'doing' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

export const repeatOptions = [
  { label: '不重复', value: '' },
  { label: '每天', value: 'daily' },
  { label: '工作日', value: 'weekdays' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '每年', value: 'yearly' },
  { label: '每 3 天', value: 'every:3' },
];

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
