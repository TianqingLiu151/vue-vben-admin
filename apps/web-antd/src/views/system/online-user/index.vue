<script setup lang="ts">
import type { AuthApi } from '#/api';

import { computed, h, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getOnlineUsersApi, kickOnlineUserApi } from '#/api';

const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const rows = ref<AuthApi.Session[]>([]);
const username = ref('');

const canKick = computed(() => hasAccessByCodes(['system:online-user:kick']));

const columns = computed(() => [
  {
    dataIndex: 'username',
    title: '用户名',
    width: 160,
  },
  {
    dataIndex: 'ip',
    title: '登录 IP',
    width: 150,
  },
  {
    dataIndex: 'userAgent',
    ellipsis: true,
    title: '浏览器或客户端',
  },
  {
    dataIndex: 'lastSeenAt',
    title: '最近活跃时间',
    width: 190,
  },
  {
    dataIndex: 'expiresAt',
    title: '会话过期时间',
    width: 190,
  },
  {
    customRender: ({ record }: { record: AuthApi.Session }) =>
      h(
        Tag,
        { color: record.status === 'active' ? 'success' : 'default' },
        () => record.status || '-',
      ),
    dataIndex: 'status',
    title: '状态',
    width: 100,
  },
  {
    customRender: ({ record }: { record: AuthApi.Session }) =>
      canKick.value
        ? h(
            Button,
            {
              danger: true,
              size: 'small',
              type: 'link',
              onClick: () => confirmKick(record),
            },
            () => '踢出',
          )
        : null,
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 100,
  },
]);

onMounted(loadOnlineUsers);

async function loadOnlineUsers() {
  loading.value = true;
  try {
    rows.value = await getOnlineUsersApi({
      username: username.value.trim() || undefined,
    });
  } finally {
    loading.value = false;
  }
}

function confirmKick(record: AuthApi.Session) {
  Modal.confirm({
    content: `确认踢出 ${record.username || record.sessionId} 的这条在线会话吗？`,
    okButtonProps: { danger: true },
    okText: '踢出',
    onOk: async () => {
      await kickOnlineUserApi(record.sessionId);
      message.success('已踢出该会话');
      await loadOnlineUsers();
    },
    title: '踢出会话',
  });
}
</script>

<template>
  <Page auto-content-height title="在线用户">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Input
        v-model:value="username"
        allow-clear
        class="w-64"
        placeholder="查询用户名"
        @press-enter="loadOnlineUsers"
      />
      <Space>
        <Button type="primary" @click="loadOnlineUsers">
          <template #icon>
            <IconifyIcon icon="lucide:search" />
          </template>
          查询
        </Button>
        <Tooltip title="刷新列表">
          <Button :loading="loading" @click="loadOnlineUsers">
            <template #icon>
              <IconifyIcon icon="lucide:refresh-cw" />
            </template>
          </Button>
        </Tooltip>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="{ pageSize: 10, showSizeChanger: true }"
      row-key="sessionId"
      size="middle"
    />
  </Page>
</template>
