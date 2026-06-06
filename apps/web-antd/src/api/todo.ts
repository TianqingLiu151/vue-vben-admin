import { requestClient } from '#/api/request';

export namespace TodoApi {
  export type TodoTaskStatus = 'cancelled' | 'completed' | 'doing' | 'todo';
  export type TodoTaskView =
    | 'active'
    | 'all'
    | 'completed'
    | 'inbox'
    | 'planned'
    | 'today';
  export type TodoPriority = 1 | 2 | 3 | 4;

  export interface PageResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
  }

  export interface TodoListItem {
    color?: string;
    createdAt?: string;
    icon?: string;
    id: string;
    isArchived: boolean;
    name: string;
    sortOrder: number;
  }

  export interface TodoTagItem {
    color?: string;
    createdAt?: string;
    id: string;
    name: string;
  }

  export interface TodoSubtaskItem {
    completedAt?: string;
    createdAt?: string;
    id: string;
    isCompleted: boolean;
    sortOrder: number;
    title: string;
  }

  export interface TodoReminderItem {
    createdAt?: string;
    id: string;
    isSent: boolean;
    remindAt: string;
  }

  export interface TodoTaskItem {
    completedAt?: string;
    createdAt?: string;
    description?: string;
    dueDate?: string;
    dueTime?: string;
    id: string;
    isStarred: boolean;
    listId?: string;
    listName?: string;
    priority: TodoPriority;
    reminders: TodoReminderItem[];
    repeatRule?: string;
    sortOrder: number;
    status: TodoTaskStatus;
    subtaskCompleted: number;
    subtasks: TodoSubtaskItem[];
    subtaskTotal: number;
    tags: TodoTagItem[];
    title: string;
    updatedAt?: string;
  }

  export interface TodoTaskQuery {
    keyword?: string;
    listId?: string;
    page?: number;
    pageSize?: number;
    priority?: number;
    status?: string;
    tagId?: string;
    view?: TodoTaskView;
  }

  export interface TodoSubtaskCreateParams {
    sortOrder?: number;
    title: string;
  }

  export interface TodoSubtaskUpdateParams {
    isCompleted?: boolean;
    sortOrder?: number;
    title?: string;
  }

  export interface TodoReminderParams {
    remindAt: string;
  }

  export interface TodoTaskCreateParams {
    description?: null | string;
    dueDate?: null | string;
    dueTime?: null | string;
    isStarred?: boolean;
    listId?: null | string;
    priority?: TodoPriority;
    reminders?: TodoReminderParams[];
    repeatRule?: null | string;
    sortOrder?: number;
    subtasks?: TodoSubtaskCreateParams[];
    tagIds?: string[];
    title: string;
  }

  export interface TodoTaskUpdateParams extends Partial<
    Omit<TodoTaskCreateParams, 'subtasks' | 'title'>
  > {
    status?: TodoTaskStatus;
    title?: string;
  }

  export interface TodoListCreateParams {
    color?: string;
    icon?: string;
    name: string;
    sortOrder?: number;
  }

  export interface TodoListUpdateParams extends Partial<TodoListCreateParams> {
    isArchived?: boolean;
  }

  export interface TodoTagCreateParams {
    color?: string;
    name: string;
  }

  export type TodoTagUpdateParams = Partial<TodoTagCreateParams>;
}

export function getTodoTasks(params: TodoApi.TodoTaskQuery) {
  return requestClient.get<TodoApi.PageResult<TodoApi.TodoTaskItem>>('/todos', {
    params,
  });
}

export function getTodoTask(id: string) {
  return requestClient.get<TodoApi.TodoTaskItem>(`/todos/${id}`);
}

export function createTodoTask(data: TodoApi.TodoTaskCreateParams) {
  return requestClient.post<TodoApi.TodoTaskItem>('/todos', data);
}

export function updateTodoTask(id: string, data: TodoApi.TodoTaskUpdateParams) {
  return requestClient.put<TodoApi.TodoTaskItem>(`/todos/${id}`, data);
}

export function deleteTodoTask(id: string) {
  return requestClient.delete(`/todos/${id}`);
}

export function completeTodoTask(id: string) {
  return requestClient.request<TodoApi.TodoTaskItem>(`/todos/${id}/complete`, {
    method: 'PATCH',
  });
}

export function uncompleteTodoTask(id: string) {
  return requestClient.request<TodoApi.TodoTaskItem>(
    `/todos/${id}/uncomplete`,
    {
      method: 'PATCH',
    },
  );
}

export function getTodoLists(params?: { includeArchived?: boolean }) {
  return requestClient.get<TodoApi.TodoListItem[]>('/todos/lists', {
    params,
  });
}

export function createTodoList(data: TodoApi.TodoListCreateParams) {
  return requestClient.post<TodoApi.TodoListItem>('/todos/lists', data);
}

export function updateTodoList(id: string, data: TodoApi.TodoListUpdateParams) {
  return requestClient.put<TodoApi.TodoListItem>(`/todos/lists/${id}`, data);
}

export function deleteTodoList(id: string) {
  return requestClient.delete(`/todos/lists/${id}`);
}

export function getTodoTags() {
  return requestClient.get<TodoApi.TodoTagItem[]>('/todos/tags');
}

export function createTodoTag(data: TodoApi.TodoTagCreateParams) {
  return requestClient.post<TodoApi.TodoTagItem>('/todos/tags', data);
}

export function updateTodoTag(id: string, data: TodoApi.TodoTagUpdateParams) {
  return requestClient.put<TodoApi.TodoTagItem>(`/todos/tags/${id}`, data);
}

export function deleteTodoTag(id: string) {
  return requestClient.delete(`/todos/tags/${id}`);
}

export function createTodoSubtask(
  taskId: string,
  data: TodoApi.TodoSubtaskCreateParams,
) {
  return requestClient.post<TodoApi.TodoSubtaskItem>(
    `/todos/${taskId}/subtasks`,
    data,
  );
}

export function updateTodoSubtask(
  id: string,
  data: TodoApi.TodoSubtaskUpdateParams,
) {
  return requestClient.put<TodoApi.TodoSubtaskItem>(
    `/todos/subtasks/${id}`,
    data,
  );
}

export function deleteTodoSubtask(id: string) {
  return requestClient.delete(`/todos/subtasks/${id}`);
}
