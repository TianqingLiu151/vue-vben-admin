import type { TodoApi } from '#/api/todo';

export type NavView = 'completed' | 'inbox' | 'planned' | 'today';
export type ResourceType = 'list' | 'tag';

export interface TodoNavView {
  icon: string;
  key: NavView;
  label: string;
}

export interface TaskDraft {
  description?: string;
  dueDate?: string;
  dueTime?: string;
  isStarred: boolean;
  listId?: string;
  priority: TodoApi.TodoPriority;
  reminderAt?: string;
  repeatRule?: string;
  status: TodoApi.TodoTaskStatus;
  tagIds: string[];
  title: string;
}

export interface TodoResourceModalState {
  color: string;
  icon: string;
  id: string;
  isArchived: boolean;
  name: string;
  open: boolean;
  sortOrder: number;
  type: ResourceType;
}
