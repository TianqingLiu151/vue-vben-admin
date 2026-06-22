<script lang="ts" setup>
import type { TablePaginationConfig } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import type { SystemAuditApi } from '#/api/system/audit';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  message,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getAuditLoginLogs,
  getAuditOperationLogDetail,
  getAuditOperationLogs,
} from '#/api/system/audit';

type LoginLog = SystemAuditApi.LoginLogItem;
type OperationLog = SystemAuditApi.OperationLogItem;
type OperationLogDetail = SystemAuditApi.OperationLogDetail;
type RangeValue = [Dayjs, Dayjs] | undefined;
type TabKey = 'login' | 'operation';

const RangePicker = DatePicker.RangePicker;
const USER_AGENT_MAX_LENGTH = 72;

const { hasAccessByCodes } = useAccess();

const canLoginList = computed(() =>
  hasAccessByCodes(['system:audit:login:list']),
);
const canOperationList = computed(() =>
  hasAccessByCodes(['system:audit:operation:list']),
);
const canOperationDetail = computed(() =>
  hasAccessByCodes(['system:audit:operation:detail']),
);

const activeTab = ref<TabKey>(canLoginList.value ? 'login' : 'operation');

const loginLoading = ref(false);
const loginRows = ref<LoginLog[]>([]);
const loginTotal = ref(0);
const loginPage = ref(1);
const loginPageSize = ref(10);

const operationLoading = ref(false);
const operationRows = ref<OperationLog[]>([]);
const operationTotal = ref(0);
const operationPage = ref(1);
const operationPageSize = ref(10);

const detailOpen = ref(false);
const detailLoading = ref(false);
const detailError = ref('');
const detail = ref<OperationLogDetail>();

const loginFilters = reactive({
  eventType: undefined as string | undefined,
  ip: '',
  status: undefined as SystemAuditApi.AuditStatus | undefined,
  timeRange: undefined as RangeValue,
  username: '',
});

const operationFilters = reactive({
  action: undefined as string | undefined,
  ip: '',
  module: undefined as string | undefined,
  operatorUsername: '',
  riskLevel: undefined as string | undefined,
  status: undefined as SystemAuditApi.AuditStatus | undefined,
  targetId: '',
  targetType: '',
  timeRange: undefined as RangeValue,
});

const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
];

const eventTypeOptions = [
  { label: '登录成功', value: 'login_success' },
  { label: '登录失败', value: 'login_failed' },
  { label: '退出登录', value: 'logout' },
  { label: '刷新成功', value: 'refresh_success' },
  { label: '刷新失败', value: 'refresh_failed' },
];

const moduleOptions = [
  { label: '用户', value: 'system_user' },
  { label: '角色', value: 'system_role' },
  { label: '菜单', value: 'system_menu' },
  { label: '定时任务', value: 'system_scheduler' },
  { label: '权限', value: 'permission' },
];

const actionOptions = [
  { label: '新增', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '启用', value: 'enable' },
  { label: '停用', value: 'disable' },
  { label: '执行', value: 'run' },
  { label: '越权', value: 'denied' },
];

const riskOptions = [
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const loginColumns = computed(() => [
  { dataIndex: 'username', key: 'username', title: '用户名', width: 90 },
  { dataIndex: 'user_id', key: 'user_id', title: '用户 ID', width: 72 },
  { dataIndex: 'event_type', key: 'event_type', title: '事件类型', width: 130 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 90 },
  {
    dataIndex: 'failure_reason',
    key: 'failure_reason',
    title: '失败原因',
    width: 120,
  },
  { dataIndex: 'ip', key: 'ip', title: 'IP', width: 120 },
  { dataIndex: 'user_agent', key: 'user_agent', title: 'User-Agent', width: 520 },
  { dataIndex: 'request_id', key: 'request_id', title: '请求 ID', width: 330 },
  { dataIndex: 'created_at', key: 'created_at', title: '时间', width: 180 },
]);

const operationColumns = computed(() => [
  {
    dataIndex: 'operator_username',
    key: 'operator',
    title: '操作人',
    width: 150,
  },
  { dataIndex: 'module', key: 'module', title: '模块', width: 150 },
  { dataIndex: 'action', key: 'action', title: '动作', width: 110 },
  { dataIndex: 'target_name', key: 'target', title: '目标', width: 180 },
  {
    dataIndex: 'permission_code',
    key: 'permission_code',
    title: '权限码',
    width: 210,
  },
  { dataIndex: 'path', key: 'request', title: '请求', width: 260 },
  { dataIndex: 'ip', key: 'ip', title: 'IP', width: 140 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 100 },
  { dataIndex: 'risk_level', key: 'risk_level', title: '风险等级', width: 120 },
  { dataIndex: 'created_at', key: 'created_at', title: '时间', width: 180 },
  { fixed: 'right' as const, key: 'operation', title: '操作', width: 90 },
]);

const emptyLocale = { emptyText: '暂无审计日志' };

const changedFieldRows = computed(() => {
  const fields = detail.value?.changed_fields ?? {};
  return Object.entries(fields).map(([field, value]) => ({
    after: formatJsonValue(value.after),
    before: formatJsonValue(value.before),
    field,
  }));
});

const activeDetailTitle = computed(() => {
  if (!detail.value) return '操作日志详情';
  return `操作日志详情 #${detail.value.id}`;
});

function cleanParams<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== '' && value !== undefined && value !== null;
    }),
  ) as Partial<T>;
}

function rangeToParams(range: RangeValue) {
  return {
    endTime: range?.[1]?.toISOString(),
    startTime: range?.[0]?.toISOString(),
  };
}

function formatTime(value?: string) {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : value;
}

function formatJsonValue(value: unknown) {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function truncateText(value?: null | string, maxLength = USER_AGENT_MAX_LENGTH) {
  if (!value) return '-';
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function statusText(status?: string) {
  const labels: Record<string, string> = {
    failed: '失败',
    success: '成功',
  };
  return status ? (labels[status] ?? status) : '-';
}

function statusColor(status?: string) {
  const colors: Record<string, string> = {
    failed: 'error',
    success: 'success',
  };
  return status ? (colors[status] ?? 'default') : 'default';
}

function riskColor(risk?: string) {
  const colors: Record<string, string> = {
    critical: 'error',
    high: 'warning',
    medium: 'default',
  };
  return risk ? (colors[risk] ?? 'default') : 'default';
}

function eventTypeText(type?: string) {
  return (
    eventTypeOptions.find((item) => item.value === type)?.label ?? type ?? '-'
  );
}

function optionText(
  options: Array<{ label: string; value: string }>,
  value?: string,
) {
  return options.find((item) => item.value === value)?.label ?? value ?? '-';
}

function targetText(row: OperationLog | OperationLogDetail | Record<string, any>) {
  return row.target_name || row.target_id || '-';
}

function changedCellText(row: Record<string, string>, key?: unknown) {
  return key === 'before' || key === 'after' ? row[key] : '';
}

function detailItemValue(value?: number | string) {
  return value === undefined || value === null || value === ''
    ? '-'
    : String(value);
}

function getErrorMessage(error: any) {
  const data = error?.response?.data ?? {};
  return data.detail ?? data.error ?? data.message ?? error?.message ?? '操作失败';
}

async function copyText(value?: number | string) {
  if (value === undefined || value === null || value === '') return;
  try {
    await navigator.clipboard.writeText(String(value));
    message.success('已复制');
  } catch {
    message.error('复制失败');
  }
}

async function loadLoginLogs() {
  if (!canLoginList.value) return;
  loginLoading.value = true;
  try {
    const res = await getAuditLoginLogs(
      cleanParams({
        eventType: loginFilters.eventType,
        ip: loginFilters.ip.trim(),
        page: loginPage.value,
        pageSize: loginPageSize.value,
        status: loginFilters.status,
        username: loginFilters.username.trim(),
        ...rangeToParams(loginFilters.timeRange),
      }),
    );
    loginRows.value = res.items;
    loginTotal.value = res.total;
  } finally {
    loginLoading.value = false;
  }
}

async function loadOperationLogs() {
  if (!canOperationList.value) return;
  operationLoading.value = true;
  try {
    const res = await getAuditOperationLogs(
      cleanParams({
        action: operationFilters.action,
        ip: operationFilters.ip.trim(),
        module: operationFilters.module,
        operatorUsername: operationFilters.operatorUsername.trim(),
        page: operationPage.value,
        pageSize: operationPageSize.value,
        riskLevel: operationFilters.riskLevel,
        status: operationFilters.status,
        targetId: operationFilters.targetId.trim(),
        targetType: operationFilters.targetType.trim(),
        ...rangeToParams(operationFilters.timeRange),
      }),
    );
    operationRows.value = res.items;
    operationTotal.value = res.total;
  } finally {
    operationLoading.value = false;
  }
}

function searchLoginLogs() {
  loginPage.value = 1;
  loadLoginLogs();
}

function resetLoginFilters() {
  Object.assign(loginFilters, {
    eventType: undefined,
    ip: '',
    status: undefined,
    timeRange: undefined,
    username: '',
  });
  searchLoginLogs();
}

function searchOperationLogs() {
  operationPage.value = 1;
  loadOperationLogs();
}

function resetOperationFilters() {
  Object.assign(operationFilters, {
    action: undefined,
    ip: '',
    module: undefined,
    operatorUsername: '',
    riskLevel: undefined,
    status: undefined,
    targetId: '',
    targetType: '',
    timeRange: undefined,
  });
  searchOperationLogs();
}

function onLoginTableChange(pagination: TablePaginationConfig) {
  loginPage.value = pagination.current ?? 1;
  loginPageSize.value = pagination.pageSize ?? 10;
  loadLoginLogs();
}

function onOperationTableChange(pagination: TablePaginationConfig) {
  operationPage.value = pagination.current ?? 1;
  operationPageSize.value = pagination.pageSize ?? 10;
  loadOperationLogs();
}

async function openDetail(row: OperationLog | Record<string, any>) {
  if (!canOperationDetail.value) return;
  detailOpen.value = true;
  detailLoading.value = true;
  detailError.value = '';
  detail.value = row as OperationLogDetail;

  try {
    detail.value = await getAuditOperationLogDetail((row as OperationLog).id);
  } catch (error) {
    detailError.value = getErrorMessage(error);
  } finally {
    detailLoading.value = false;
  }
}

watch([canLoginList, canOperationList], () => {
  if (activeTab.value === 'login' && !canLoginList.value) {
    activeTab.value = 'operation';
  }
  if (activeTab.value === 'operation' && !canOperationList.value) {
    activeTab.value = 'login';
  }
});

watch(activeTab, (tab) => {
  if (tab === 'login' && loginRows.value.length === 0) {
    loadLoginLogs();
  }
  if (tab === 'operation' && operationRows.value.length === 0) {
    loadOperationLogs();
  }
});

onMounted(() => {
  if (canLoginList.value) {
    activeTab.value = 'login';
    loadLoginLogs();
    return;
  }

  if (canOperationList.value) {
    activeTab.value = 'operation';
    loadOperationLogs();
  }
});
</script>

<template>
  <Page auto-content-height>
    <div class="audit-page">
      <Tabs v-model:active-key="activeTab">
        <Tabs.TabPane v-if="canLoginList" key="login" tab="登录日志">
          <Form class="audit-filter" layout="inline">
            <Form.Item label="用户名">
              <Input
                v-model:value="loginFilters.username"
                allow-clear
                placeholder="用户名"
                @press-enter="searchLoginLogs"
              />
            </Form.Item>
            <Form.Item label="事件类型">
              <Select
                v-model:value="loginFilters.eventType"
                allow-clear
                class="audit-filter-select"
                :options="eventTypeOptions"
                placeholder="全部"
              />
            </Form.Item>
            <Form.Item label="状态">
              <Select
                v-model:value="loginFilters.status"
                allow-clear
                class="audit-filter-select"
                :options="statusOptions"
                placeholder="全部"
              />
            </Form.Item>
            <Form.Item label="IP">
              <Input
                v-model:value="loginFilters.ip"
                allow-clear
                placeholder="IP"
                @press-enter="searchLoginLogs"
              />
            </Form.Item>
            <Form.Item label="时间范围">
              <RangePicker
                v-model:value="loginFilters.timeRange"
                show-time
                class="audit-range"
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" @click="searchLoginLogs">
                  <IconifyIcon icon="lucide:search" />
                  查询
                </Button>
                <Button @click="resetLoginFilters">
                  <IconifyIcon icon="lucide:rotate-ccw" />
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>

          <Table
            :columns="loginColumns"
            :data-source="loginRows"
            :loading="loginLoading"
            :locale="emptyLocale"
            :pagination="{
              current: loginPage,
              pageSize: loginPageSize,
              showSizeChanger: true,
              showTotal: (value: number) => `共 ${value} 条`,
              total: loginTotal,
            }"
            row-key="id"
            size="small"
            :scroll="{ x: 1652 }"
            table-layout="fixed"
            @change="onLoginTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'username'">
                {{ record.username || '-' }}
              </template>
              <template v-else-if="column.key === 'user_id'">
                {{ record.user_id ?? '-' }}
              </template>
              <template v-else-if="column.key === 'event_type'">
                <Tag color="processing">{{ eventTypeText(record.event_type) }}</Tag>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="statusColor(record.status)">
                  {{ statusText(record.status) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'failure_reason'">
                <Tooltip :title="record.failure_reason">
                  <span class="audit-ellipsis">{{ record.failure_reason || '-' }}</span>
                </Tooltip>
              </template>
              <template v-else-if="column.key === 'ip'">
                {{ record.ip || '-' }}
              </template>
              <template v-else-if="column.key === 'user_agent'">
                <Tooltip :title="record.user_agent">
                  <span class="audit-ellipsis audit-user-agent">
                    {{ truncateText(record.user_agent) }}
                  </span>
                </Tooltip>
              </template>
              <template v-else-if="column.key === 'request_id'">
                <Button
                  v-if="record.request_id"
                  class="audit-request-id"
                  size="small"
                  type="link"
                  @click="copyText(record.request_id)"
                >
                  {{ record.request_id }}
                </Button>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'created_at'">
                {{ formatTime(record.created_at) }}
              </template>
            </template>
          </Table>
        </Tabs.TabPane>

        <Tabs.TabPane v-if="canOperationList" key="operation" tab="操作日志">
          <Form class="audit-filter" layout="inline">
            <Form.Item label="操作人">
              <Input
                v-model:value="operationFilters.operatorUsername"
                allow-clear
                placeholder="操作人"
                @press-enter="searchOperationLogs"
              />
            </Form.Item>
            <Form.Item label="模块">
              <Select
                v-model:value="operationFilters.module"
                allow-clear
                class="audit-filter-select"
                :options="moduleOptions"
                placeholder="全部"
              />
            </Form.Item>
            <Form.Item label="动作">
              <Select
                v-model:value="operationFilters.action"
                allow-clear
                class="audit-filter-select"
                :options="actionOptions"
                placeholder="全部"
              />
            </Form.Item>
            <Form.Item label="目标类型">
              <Input
                v-model:value="operationFilters.targetType"
                allow-clear
                placeholder="目标类型"
                @press-enter="searchOperationLogs"
              />
            </Form.Item>
            <Form.Item label="目标 ID">
              <Input
                v-model:value="operationFilters.targetId"
                allow-clear
                placeholder="目标 ID"
                @press-enter="searchOperationLogs"
              />
            </Form.Item>
            <Form.Item label="状态">
              <Select
                v-model:value="operationFilters.status"
                allow-clear
                class="audit-filter-select"
                :options="statusOptions"
                placeholder="全部"
              />
            </Form.Item>
            <Form.Item label="风险等级">
              <Select
                v-model:value="operationFilters.riskLevel"
                allow-clear
                class="audit-filter-select"
                :options="riskOptions"
                placeholder="全部"
              />
            </Form.Item>
            <Form.Item label="IP">
              <Input
                v-model:value="operationFilters.ip"
                allow-clear
                placeholder="IP"
                @press-enter="searchOperationLogs"
              />
            </Form.Item>
            <Form.Item label="时间范围">
              <RangePicker
                v-model:value="operationFilters.timeRange"
                show-time
                class="audit-range"
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" @click="searchOperationLogs">
                  <IconifyIcon icon="lucide:search" />
                  查询
                </Button>
                <Button @click="resetOperationFilters">
                  <IconifyIcon icon="lucide:rotate-ccw" />
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>

          <Table
            :columns="operationColumns"
            :data-source="operationRows"
            :loading="operationLoading"
            :locale="emptyLocale"
            :pagination="{
              current: operationPage,
              pageSize: operationPageSize,
              showSizeChanger: true,
              showTotal: (value: number) => `共 ${value} 条`,
              total: operationTotal,
            }"
            row-key="id"
            size="small"
            :scroll="{ x: 1800 }"
            @change="onOperationTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'operator'">
                <div>{{ record.operator_username || '-' }}</div>
                <div class="audit-muted">ID: {{ record.operator_id ?? '-' }}</div>
              </template>
              <template v-else-if="column.key === 'module'">
                <Tag>{{ optionText(moduleOptions, record.module) }}</Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Tag color="processing">
                  {{ optionText(actionOptions, record.action) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'target'">
                <div>{{ targetText(record) }}</div>
                <Button
                  v-if="record.target_id"
                  class="audit-copy-link"
                  size="small"
                  type="link"
                  @click="copyText(record.target_id)"
                >
                  {{ record.target_type || 'ID' }}: {{ record.target_id }}
                </Button>
              </template>
              <template v-else-if="column.key === 'permission_code'">
                <Button
                  v-if="record.permission_code"
                  class="audit-mono audit-copy-link"
                  size="small"
                  type="link"
                  @click="copyText(record.permission_code)"
                >
                  {{ record.permission_code }}
                </Button>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'request'">
                <Tooltip :title="`${record.method || '-'} ${record.path || '-'}`">
                  <span class="audit-ellipsis audit-mono">
                    {{ record.method || '-' }} {{ record.path || '-' }}
                  </span>
                </Tooltip>
              </template>
              <template v-else-if="column.key === 'ip'">
                {{ record.ip || '-' }}
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="statusColor(record.status)">
                  {{ statusText(record.status) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'risk_level'">
                <Tag :color="riskColor(record.risk_level)">
                  {{ record.risk_level || '-' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'created_at'">
                {{ formatTime(record.created_at) }}
              </template>
              <template v-else-if="column.key === 'operation'">
                <Button
                  v-if="canOperationDetail"
                  size="small"
                  type="link"
                  @click="openDetail(record)"
                >
                  详情
                </Button>
              </template>
            </template>
          </Table>
        </Tabs.TabPane>
      </Tabs>

      <Drawer
        v-model:open="detailOpen"
        :destroy-on-close="false"
        :title="activeDetailTitle"
        :width="860"
      >
        <Alert
          v-if="detailError"
          class="audit-detail-alert"
          :message="detailError"
          show-icon
          type="error"
        />

        <div v-if="detail" class="audit-detail" :class="{ 'is-loading': detailLoading }">
          <section>
            <h3>基础信息</h3>
            <Descriptions bordered size="small" :column="2">
              <Descriptions.Item label="操作人">
                {{ detail.operator_username || '-' }}
                <span class="audit-muted">ID: {{ detail.operator_id ?? '-' }}</span>
              </Descriptions.Item>
              <Descriptions.Item label="发生时间">
                {{ formatTime(detail.created_at) }}
              </Descriptions.Item>
              <Descriptions.Item label="模块">
                {{ optionText(moduleOptions, detail.module) }}
              </Descriptions.Item>
              <Descriptions.Item label="动作">
                {{ optionText(actionOptions, detail.action) }}
              </Descriptions.Item>
              <Descriptions.Item label="目标">
                {{ targetText(detail) }}
              </Descriptions.Item>
              <Descriptions.Item label="目标 ID">
                <Button
                  v-if="detail.target_id"
                  size="small"
                  type="link"
                  @click="copyText(detail.target_id)"
                >
                  {{ detail.target_id }}
                </Button>
                <span v-else>-</span>
              </Descriptions.Item>
              <Descriptions.Item label="权限码">
                <Button
                  v-if="detail.permission_code"
                  class="audit-mono audit-copy-link"
                  size="small"
                  type="link"
                  @click="copyText(detail.permission_code)"
                >
                  {{ detail.permission_code }}
                </Button>
                <span v-else>-</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag :color="statusColor(detail.status)">
                  {{ statusText(detail.status) }}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag :color="riskColor(detail.risk_level)">
                  {{ detail.risk_level || '-' }}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="错误信息" :span="2">
                <Tooltip :title="detail.error_message">
                  <span class="audit-ellipsis">{{ detail.error_message || '-' }}</span>
                </Tooltip>
              </Descriptions.Item>
            </Descriptions>
          </section>

          <section>
            <h3>请求信息</h3>
            <Descriptions bordered size="small" :column="2">
              <Descriptions.Item label="Method">
                {{ detailItemValue(detail.method) }}
              </Descriptions.Item>
              <Descriptions.Item label="IP">
                {{ detailItemValue(detail.ip) }}
              </Descriptions.Item>
              <Descriptions.Item label="Path" :span="2">
                <Tooltip :title="detail.path">
                  <span class="audit-ellipsis audit-mono">{{ detail.path || '-' }}</span>
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label="User-Agent" :span="2">
                <Tooltip :title="detail.user_agent">
                  <span class="audit-ellipsis">{{ detail.user_agent || '-' }}</span>
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label="Request ID" :span="2">
                <Button
                  v-if="detail.request_id"
                  class="audit-copy-link"
                  size="small"
                  type="link"
                  @click="copyText(detail.request_id)"
                >
                  {{ detail.request_id }}
                </Button>
                <span v-else>-</span>
              </Descriptions.Item>
            </Descriptions>
          </section>

          <section>
            <h3>变更字段</h3>
            <Table
              :columns="[
                { dataIndex: 'field', key: 'field', title: '字段', width: 180 },
                { dataIndex: 'before', key: 'before', title: '变更前' },
                { dataIndex: 'after', key: 'after', title: '变更后' },
              ]"
              :data-source="changedFieldRows"
              :locale="emptyLocale"
              :pagination="false"
              row-key="field"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'field'">
                  <span class="audit-mono">{{ record.field }}</span>
                </template>
                <template v-else>
                  <pre class="audit-code">{{ changedCellText(record, column.key) }}</pre>
                </template>
              </template>
            </Table>
          </section>

          <section>
            <h3>原始快照</h3>
            <div class="audit-json-grid">
              <div>
                <div class="audit-json-title">Before</div>
                <pre class="audit-json">{{ formatJsonValue(detail.before_data) }}</pre>
              </div>
              <div>
                <div class="audit-json-title">After</div>
                <pre class="audit-json">{{ formatJsonValue(detail.after_data) }}</pre>
              </div>
            </div>
          </section>
        </div>
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.audit-page {
  min-height: 100%;
  padding: 16px;
  background: hsl(var(--background));
}

.audit-filter {
  row-gap: 12px;
  margin-bottom: 16px;
}

.audit-filter-select {
  width: 150px;
}

.audit-range {
  width: 360px;
}

.audit-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
}

.audit-muted {
  margin-left: 4px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.audit-mono,
.audit-code,
.audit-json {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
}

.audit-copy-link {
  max-width: 100%;
  height: auto;
  padding: 0;
  white-space: normal;
}

.audit-request-id {
  max-width: 100%;
  padding: 0;
  overflow-wrap: anywhere;
  text-align: left;
  white-space: normal;
}

.audit-user-agent {
  width: 100%;
}

.audit-detail-alert {
  margin-bottom: 12px;
}

.audit-detail.is-loading {
  opacity: 0.6;
}

.audit-detail section + section {
  margin-top: 20px;
}

.audit-detail h3 {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
}

.audit-code {
  max-height: 160px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
}

.audit-json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.audit-json-title {
  margin-bottom: 6px;
  font-weight: 600;
}

.audit-json {
  min-height: 180px;
  max-height: 360px;
  padding: 12px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  white-space: pre-wrap;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

@media (max-width: 768px) {
  .audit-filter :deep(.ant-form-item) {
    width: 100%;
    margin-right: 0;
  }

  .audit-filter :deep(.ant-form-item-control),
  .audit-filter-select,
  .audit-range {
    width: 100%;
  }

  .audit-json-grid {
    grid-template-columns: 1fr;
  }
}
</style>
