<script setup lang="ts">
import type { AuthApi } from '#/api';

import { computed, h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getMySessionsApi, revokeMySessionApi } from '#/api';

const loading = ref(false);
const rows = ref<AuthApi.Session[]>([]);

const columns = computed(() => [
  {
    customRender: ({ record }: { record: AuthApi.Session }) =>
      record.deviceLabel || record.userAgent || '-',
    dataIndex: 'deviceLabel',
    ellipsis: true,
    title: '设备',
  },
  {
    dataIndex: 'ip',
    title: '登录 IP',
    width: 150,
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
      h(
        Button,
        {
          danger: true,
          size: 'small',
          type: 'link',
          onClick: () => confirmRevoke(record),
        },
        () => '退出',
      ),
    dataIndex: 'operation',
    fixed: 'right' as const,
    title: '操作',
    width: 100,
  },
]);

onMounted(loadSessions);

async function loadSessions() {
  loading.value = true;
  try {
    rows.value = await getMySessionsApi();
  } finally {
    loading.value = false;
  }
}

function confirmRevoke(record: AuthApi.Session) {
  Modal.confirm({
    content: '确认退出这个设备上的登录会话吗？',
    okButtonProps: { danger: true },
    okText: '退出',
    onOk: async () => {
      await revokeMySessionApi(record.sessionId);
      message.success('已退出该设备');
      await loadSessions();
    },
    title: '退出设备',
  });
}
</script>

<template>
  <Page auto-content-height title="我的设备">
    <div class="mb-4 flex justify-end">
      <Space>
        <Tooltip title="刷新列表">
          <Button :loading="loading" @click="loadSessions">
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
