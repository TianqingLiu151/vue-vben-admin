import type { TodoApi } from '#/api/todo';

import type {
  NavView,
  ResourceType,
  TaskDraft,
  TodoResourceModalState,
} from '../types';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { message, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  completeTodoTask,
  createTodoList,
  createTodoSubtask,
  createTodoTag,
  createTodoTask,
  deleteTodoList,
  deleteTodoSubtask,
  deleteTodoTag,
  deleteTodoTask,
  getTodoLists,
  getTodoTags,
  getTodoTask,
  getTodoTasks,
  uncompleteTodoTask,
  updateTodoList,
  updateTodoSubtask,
  updateTodoTag,
  updateTodoTask,
} from '#/api/todo';

import { baseViews } from '../constants';

function normalizeTime(value?: string) {
  if (!value) return undefined;
  return value.length === 5 ? `${value}:00` : value;
}

export function useTodoPage() {
  const route = useRoute();
  const router = useRouter();

  route.meta.fullPathKey = false;
  for (const record of route.matched) {
    if (record.path === '/todos') {
      record.meta.fullPathKey = false;
    }
  }

  const lists = ref<TodoApi.TodoListItem[]>([]);
  const tags = ref<TodoApi.TodoTagItem[]>([]);
  const tasks = ref<TodoApi.TodoTaskItem[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(10);
  const loading = ref(false);
  const metaLoading = ref(false);
  const saving = ref(false);
  const quickTitle = ref('');
  const keyword = ref('');
  const statusFilter = ref<string>();
  const priorityFilter = ref<number>();
  const activeTask = ref<TodoApi.TodoTaskItem>();
  const detailOpen = ref(false);
  const newSubtaskTitle = ref('');

  const draft = reactive<TaskDraft>({
    description: '',
    dueDate: '',
    dueTime: '',
    isStarred: false,
    listId: '',
    priority: 4,
    reminderAt: '',
    repeatRule: '',
    status: 'todo',
    tagIds: [],
    title: '',
  });

  const resourceModal = reactive<TodoResourceModalState>({
    color: '#1677ff',
    icon: 'lucide:list',
    id: '',
    isArchived: false,
    name: '',
    open: false,
    sortOrder: 0,
    type: 'list',
  });

  const listOptions = computed(() => [
    { label: '无清单', value: '' },
    ...lists.value.map((item) => ({ label: item.name, value: item.id })),
  ]);

  const tagOptions = computed(() =>
    tags.value.map((item) => ({ label: item.name, value: item.id })),
  );

  const currentView = computed<TodoApi.TodoTaskView>(() => {
    if (route.query.listId || route.query.tagId) {
      return 'active';
    }
    const view = route.query.view;
    return typeof view === 'string' &&
      ['completed', 'inbox', 'planned', 'today'].includes(view)
      ? (view as TodoApi.TodoTaskView)
      : 'inbox';
  });

  const currentListId = computed(() =>
    typeof route.query.listId === 'string' ? route.query.listId : undefined,
  );
  const currentTagId = computed(() =>
    typeof route.query.tagId === 'string' ? route.query.tagId : undefined,
  );

  const currentTitle = computed(() => {
    if (currentListId.value) {
      return (
        lists.value.find((item) => item.id === currentListId.value)?.name ??
        '清单'
      );
    }
    if (currentTagId.value) {
      return (
        tags.value.find((item) => item.id === currentTagId.value)?.name ??
        '标签'
      );
    }
    return (
      baseViews.find((item) => item.key === currentView.value)?.label ?? '待办'
    );
  });

  function isCurrentView(key: NavView) {
    return (
      !currentListId.value && !currentTagId.value && currentView.value === key
    );
  }

  function isDone(task: TodoApi.TodoTaskItem) {
    return task.status === 'completed';
  }

  function isOverdue(task: TodoApi.TodoTaskItem) {
    return (
      !!task.dueDate &&
      task.status !== 'completed' &&
      dayjs(task.dueDate).isBefore(dayjs(), 'day')
    );
  }

  function navToView(view: NavView) {
    page.value = 1;
    router.replace({ path: '/todos', query: { view } });
  }

  function navToList(id: string) {
    page.value = 1;
    router.replace({ path: '/todos', query: { listId: id } });
  }

  function navToTag(id: string) {
    page.value = 1;
    router.replace({ path: '/todos', query: { tagId: id } });
  }

  async function loadMeta() {
    metaLoading.value = true;
    try {
      const [listRes, tagRes] = await Promise.all([
        getTodoLists(),
        getTodoTags(),
      ]);
      lists.value = listRes;
      tags.value = tagRes;
    } finally {
      metaLoading.value = false;
    }
  }

  async function loadTasks() {
    loading.value = true;
    try {
      const result = await getTodoTasks({
        keyword: keyword.value || undefined,
        listId: currentListId.value,
        page: page.value,
        pageSize: pageSize.value,
        priority: priorityFilter.value,
        status: statusFilter.value,
        tagId: currentTagId.value,
        view: currentView.value,
      });
      tasks.value = result.items;
      total.value = result.total;
    } finally {
      loading.value = false;
    }
  }

  async function reloadAll() {
    await Promise.all([loadMeta(), loadTasks()]);
  }

  function buildCreateDefaults(): Partial<TodoApi.TodoTaskCreateParams> {
    const defaults: Partial<TodoApi.TodoTaskCreateParams> = {
      priority: 4,
      tagIds: [],
    };
    if (currentListId.value) {
      defaults.listId = currentListId.value;
    }
    if (currentTagId.value) {
      defaults.tagIds = [currentTagId.value];
    }
    if (currentView.value === 'today') {
      defaults.dueDate = dayjs().format('YYYY-MM-DD');
    }
    return defaults;
  }

  async function createQuickTask() {
    const title = quickTitle.value.trim();
    if (!title) return;
    await createTodoTask({
      ...buildCreateDefaults(),
      title,
    });
    quickTitle.value = '';
    message.success('任务已创建');
    await loadTasks();
  }

  async function openTask(task: TodoApi.TodoTaskItem) {
    activeTask.value = task;
    detailOpen.value = true;
    const detail = await getTodoTask(task.id);
    activeTask.value = detail;
    Object.assign(draft, {
      description: detail.description ?? '',
      dueDate: detail.dueDate ?? '',
      dueTime: detail.dueTime ? detail.dueTime.slice(0, 5) : '',
      isStarred: detail.isStarred,
      listId: detail.listId ?? '',
      priority: detail.priority,
      reminderAt: detail.reminders[0]?.remindAt
        ? dayjs(detail.reminders[0].remindAt).format('YYYY-MM-DDTHH:mm')
        : '',
      repeatRule: detail.repeatRule ?? '',
      status: detail.status,
      tagIds: detail.tags.map((item) => item.id),
      title: detail.title,
    });
  }

  function patchTaskInList(task: TodoApi.TodoTaskItem) {
    const index = tasks.value.findIndex((item) => item.id === task.id);
    if (index !== -1) {
      tasks.value[index] = task;
    }
    if (activeTask.value?.id === task.id) {
      activeTask.value = task;
    }
  }

  async function toggleComplete(task: TodoApi.TodoTaskItem) {
    const result = isDone(task)
      ? await uncompleteTodoTask(task.id)
      : await completeTodoTask(task.id);
    patchTaskInList(result);
    await loadTasks();
  }

  async function toggleStar(task: TodoApi.TodoTaskItem) {
    const result = await updateTodoTask(task.id, {
      isStarred: !task.isStarred,
    });
    patchTaskInList(result);
  }

  function confirmDeleteTask(task: TodoApi.TodoTaskItem) {
    Modal.confirm({
      content: `确定删除「${task.title}」吗？`,
      okText: '删除',
      okType: 'danger',
      title: '删除任务',
      async onOk() {
        await deleteTodoTask(task.id);
        if (activeTask.value?.id === task.id) {
          detailOpen.value = false;
          activeTask.value = undefined;
        }
        message.success('任务已删除');
        await loadTasks();
      },
    });
  }

  async function saveTaskDetail() {
    if (!activeTask.value) return;
    const title = draft.title.trim();
    if (!title) {
      message.warning('请输入任务标题');
      return;
    }

    saving.value = true;
    try {
      const result = await updateTodoTask(activeTask.value.id, {
        description: draft.description || null,
        dueDate: draft.dueDate || null,
        dueTime: normalizeTime(draft.dueTime) || null,
        isStarred: draft.isStarred,
        listId: draft.listId || null,
        priority: draft.priority,
        reminders: draft.reminderAt
          ? [{ remindAt: dayjs(draft.reminderAt).toISOString() }]
          : [],
        repeatRule: draft.repeatRule || null,
        status: draft.status,
        tagIds: draft.tagIds,
        title,
      } as TodoApi.TodoTaskUpdateParams);
      patchTaskInList(result);
      message.success('任务已保存');
      await loadTasks();
    } finally {
      saving.value = false;
    }
  }

  async function createSubtask() {
    const title = newSubtaskTitle.value.trim();
    if (!activeTask.value || !title) return;
    await createTodoSubtask(activeTask.value.id, {
      sortOrder: activeTask.value.subtasks.length,
      title,
    });
    newSubtaskTitle.value = '';
    await openTask(activeTask.value);
  }

  async function toggleSubtask(item: TodoApi.TodoSubtaskItem) {
    if (!activeTask.value) return;
    await updateTodoSubtask(item.id, {
      isCompleted: !item.isCompleted,
    });
    await openTask(activeTask.value);
    await loadTasks();
  }

  async function removeSubtask(item: TodoApi.TodoSubtaskItem) {
    if (!activeTask.value) return;
    await deleteTodoSubtask(item.id);
    await openTask(activeTask.value);
    await loadTasks();
  }

  function openResourceModal(
    type: ResourceType,
    item?: TodoApi.TodoListItem | TodoApi.TodoTagItem,
  ) {
    resourceModal.type = type;
    resourceModal.id = item?.id ?? '';
    resourceModal.name = item?.name ?? '';
    resourceModal.color =
      item?.color ?? (type === 'list' ? '#1677ff' : '#0f766e');
    resourceModal.icon =
      type === 'list'
        ? ((item as TodoApi.TodoListItem | undefined)?.icon ?? 'lucide:list')
        : '';
    resourceModal.sortOrder =
      type === 'list'
        ? ((item as TodoApi.TodoListItem | undefined)?.sortOrder ?? 0)
        : 0;
    resourceModal.isArchived =
      type === 'list'
        ? ((item as TodoApi.TodoListItem | undefined)?.isArchived ?? false)
        : false;
    resourceModal.open = true;
  }

  async function saveResource() {
    const name = resourceModal.name.trim();
    if (!name) {
      message.warning('请输入名称');
      return;
    }
    if (resourceModal.type === 'list') {
      const payload: TodoApi.TodoListUpdateParams = {
        color: resourceModal.color,
        icon: resourceModal.icon,
        isArchived: resourceModal.isArchived,
        name,
        sortOrder: resourceModal.sortOrder,
      };
      await (resourceModal.id
        ? updateTodoList(resourceModal.id, payload)
        : createTodoList(payload as TodoApi.TodoListCreateParams));
    } else if (resourceModal.id) {
      await updateTodoTag(resourceModal.id, {
        color: resourceModal.color,
        name,
      });
    } else {
      await createTodoTag({
        color: resourceModal.color,
        name,
      });
    }
    resourceModal.open = false;
    message.success('已保存');
    await loadMeta();
  }

  function confirmDeleteResource(
    type: ResourceType,
    item: TodoApi.TodoListItem | TodoApi.TodoTagItem,
  ) {
    Modal.confirm({
      content:
        type === 'list'
          ? '删除清单后，清单内任务会回到无清单状态。'
          : '删除标签后，任务上的该标签会被移除。',
      okText: '删除',
      okType: 'danger',
      title: `删除「${item.name}」`,
      async onOk() {
        if (type === 'list') {
          await deleteTodoList(item.id);
          if (currentListId.value === item.id) {
            navToView('inbox');
          }
        } else {
          await deleteTodoTag(item.id);
          if (currentTagId.value === item.id) {
            navToView('inbox');
          }
        }
        await reloadAll();
      },
    });
  }

  function resetFilters() {
    keyword.value = '';
    statusFilter.value = undefined;
    priorityFilter.value = undefined;
    page.value = 1;
    loadTasks();
  }

  watch(
    () => route.query,
    () => {
      page.value = 1;
      loadTasks();
    },
  );

  onMounted(reloadAll);

  return {
    activeTask,
    currentListId,
    currentTagId,
    currentTitle,
    currentView,
    detailOpen,
    draft,
    isCurrentView,
    isDone,
    isOverdue,
    keyword,
    listOptions,
    lists,
    loadTasks,
    loading,
    metaLoading,
    navToList,
    navToTag,
    navToView,
    newSubtaskTitle,
    openResourceModal,
    openTask,
    page,
    pageSize,
    priorityFilter,
    quickTitle,
    reloadAll,
    resourceModal,
    resetFilters,
    saveResource,
    saveTaskDetail,
    saving,
    statusFilter,
    tagOptions,
    tags,
    tasks,
    total,
    createQuickTask,
    createSubtask,
    toggleComplete,
    toggleStar,
    toggleSubtask,
    removeSubtask,
    confirmDeleteResource,
    confirmDeleteTask,
  };
}
