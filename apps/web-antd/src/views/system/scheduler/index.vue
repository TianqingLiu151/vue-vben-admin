<script lang="ts" setup>
import type { FormInstance, TablePaginationConfig } from 'ant-design-vue';

import type { SystemSchedulerApi } from '#/api/system/scheduler';

import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  RadioGroup,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  disableSchedulerJob,
  enableSchedulerJob,
  getSchedulerJobLogs,
  getSchedulerJobs,
  runSchedulerJob,
  updateSchedulerJob,
} from '#/api/system/scheduler';

const { hasAccessByCodes } = useAccess();

type Job = SystemSchedulerApi.SchedulerJobItem;
type JobLog = SystemSchedulerApi.SchedulerJobLogItem;
type RunStatus = SystemSchedulerApi.SchedulerRunStatus;
type TriggerType = SystemSchedulerApi.SchedulerTriggerType;

const jobs = ref<Job[]>([]);
const total = ref(0);
const loading = ref(false);
const runningCode = ref('');
const page = ref(1);
const pageSize = ref(10);

const enabledFilter = ref<'all' | 'disabled' | 'enabled'>('all');
const statusFilter = ref<'all' | RunStatus>('all');
const keyword = ref('');

const editOpen = ref(false);
const saving = ref(false);
const editFormRef = ref<FormInstance>();
const activeJob = ref<Job>();

const logsOpen = ref(false);
const logs = ref<JobLog[]>([]);
const logsTotal = ref(0);
const logsPage = ref(1);
const logsPageSize = ref(10);
const logsLoading = ref(false);

let jobsTimer: ReturnType<typeof setInterval> | undefined;
let logsTimer: ReturnType<typeof setInterval> | undefined;

const editForm = reactive({
  coalesce: true,
  cronExpression: '',
  description: '',
  enabled: true,
  intervalSeconds: 60,
  maxInstances: 1,
  misfireGraceSeconds: 30,
  name: '',
  triggerType: 'interval' as TriggerType,
});

const jobColumns = [
  { dataIndex: 'name', key: 'name', title: '任务名称', width: 260 },
  { dataIndex: 'triggerType', key: 'trigger', title: '触发规则', width: 180 },
  { dataIndex: 'enabled', key: 'enabled', title: '启用状态', width: 120 },
  { dataIndex: 'lastStatus', key: 'lastStatus', title: '最近状态', width: 120 },
  { dataIndex: 'lastRunAt', key: 'lastRunAt', title: '上次执行', width: 180 },
  { dataIndex: 'nextRunAt', key: 'nextRunAt', title: '下次执行', width: 180 },
  { dataIndex: 'configVersion', key: 'configVersion', title: '配置版本', width: 100 },
  { key: 'operation', title: '操作', width: 230 },
];

const logColumns = [
  { dataIndex: 'startedAt', key: 'startedAt', title: '开始时间', width: 180 },
  { dataIndex: 'finishedAt', key: 'finishedAt', title: '结束时间', width: 180 },
  { dataIndex: 'durationMs', key: 'durationMs', title: '耗时', width: 100 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 100 },
  { dataIndex: 'message', key: 'message', title: '消息' },
  { dataIndex: 'error', key: 'error', title: '错误', width: 100 },
];

const enabledOptions = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
];

const runStatusOptions = [
  { label: '全部结果', value: 'all' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '跳过', value: 'skipped' },
];

const triggerOptions = [
  { label: '间隔执行', value: 'interval' },
  { label: 'Cron 表达式', value: 'cron' },
];

const intervalShortcuts = [
  { label: '5 秒', value: 5 },
  { label: '30 秒', value: 30 },
  { label: '1 分钟', value: 60 },
  { label: '5 分钟', value: 300 },
  { label: '10 分钟', value: 600 },
  { label: '1 小时', value: 3600 },
];

const editRules = computed<Record<string, any[]>>(() => ({
  cronExpression:
    editForm.triggerType === 'cron'
      ? [{ message: '请输入 cron 表达式', required: true, trigger: 'blur' }]
      : [],
  intervalSeconds:
    editForm.triggerType === 'interval'
      ? [{ message: '请输入间隔秒数', required: true, trigger: 'change' }]
      : [],
  maxInstances: [{ message: '请输入最大实例数', required: true, trigger: 'change' }],
  misfireGraceSeconds: [
    { message: '请输入错过触发宽限秒数', required: true, trigger: 'change' },
  ],
  name: [
    { message: '请输入任务名称', required: true, trigger: 'blur' },
    { max: 100, message: '任务名称最多 100 个字符', trigger: 'blur' },
  ],
}));

const filteredJobs = computed(() => {
  const text = keyword.value.trim().toLowerCase();

  return jobs.value.filter((job) => {
    const enabledMatched =
      enabledFilter.value === 'all' ||
      (enabledFilter.value === 'enabled' ? job.enabled : !job.enabled);
    const statusMatched =
      statusFilter.value === 'all' || job.lastStatus === statusFilter.value;
    const keywordMatched =
      !text ||
      job.code.toLowerCase().includes(text) ||
      job.name.toLowerCase().includes(text);

    return enabledMatched && statusMatched && keywordMatched;
  });
});

function can(code: string) {
  return hasAccessByCodes([code]);
}

function formatTime(value?: string) {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : value;
}

function formatDuration(value?: number) {
  if (value === undefined || value === null) return '-';
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${value} ms`;
}

function triggerText(row: Job | Record<string, any>) {
  const job = row as Job;
  if (job.triggerType === 'interval') {
    return `每 ${job.intervalSeconds ?? '-'} 秒`;
  }

  return job.cronExpression || '-';
}

function statusColor(status?: RunStatus) {
  const colors: Record<RunStatus, string> = {
    failed: 'error',
    skipped: 'warning',
    success: 'success',
  };
  return status ? colors[status] : 'default';
}

function statusText(status?: RunStatus) {
  const labels: Record<RunStatus, string> = {
    failed: '失败',
    skipped: '跳过',
    success: '成功',
  };
  return status ? labels[status] : '暂无';
}

function getErrorMessage(error: any) {
  const data = error?.response?.data ?? {};
  return data.detail ?? data.error ?? data.message ?? error?.message ?? '操作失败';
}

async function loadJobs(options?: { silent?: boolean }) {
  if (!options?.silent) loading.value = true;
  try {
    const res = await getSchedulerJobs({
      page: page.value,
      pageSize: pageSize.value,
    });
    jobs.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

async function loadLogs(options?: { silent?: boolean }) {
  if (!activeJob.value) return;
  if (!options?.silent) logsLoading.value = true;
  try {
    const res = await getSchedulerJobLogs(activeJob.value.code, {
      page: logsPage.value,
      pageSize: logsPageSize.value,
    });
    logs.value = res.items;
    logsTotal.value = res.total;
  } finally {
    logsLoading.value = false;
  }
}

function onJobsTableChange(pagination: TablePaginationConfig) {
  page.value = pagination.current ?? 1;
  pageSize.value = pagination.pageSize ?? 10;
  loadJobs();
}

function onLogsTableChange(pagination: TablePaginationConfig) {
  logsPage.value = pagination.current ?? 1;
  logsPageSize.value = pagination.pageSize ?? 10;
  loadLogs();
}

function openEdit(row: Job | Record<string, any>) {
  const job = row as Job;
  activeJob.value = job;
  Object.assign(editForm, {
    coalesce: job.coalesce,
    cronExpression: job.cronExpression ?? '',
    description: job.description ?? '',
    enabled: job.enabled,
    intervalSeconds: job.intervalSeconds ?? 60,
    maxInstances: job.maxInstances ?? 1,
    misfireGraceSeconds: job.misfireGraceSeconds ?? 30,
    name: job.name,
    triggerType: job.triggerType,
  });
  editOpen.value = true;
}

async function saveJob() {
  if (!activeJob.value) return;
  await editFormRef.value?.validate();
  saving.value = true;
  try {
    await updateSchedulerJob(activeJob.value.code, {
      coalesce: editForm.coalesce,
      cronExpression:
        editForm.triggerType === 'cron' ? editForm.cronExpression : undefined,
      description: editForm.description,
      enabled: editForm.enabled,
      intervalSeconds:
        editForm.triggerType === 'interval'
          ? editForm.intervalSeconds
          : undefined,
      maxInstances: editForm.maxInstances,
      misfireGraceSeconds: editForm.misfireGraceSeconds,
      name: editForm.name,
      triggerType: editForm.triggerType,
    });
    message.success('配置已保存，调度进程将在数秒内同步');
    editOpen.value = false;
    await loadJobs();
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

function confirmAction(title: string, content: string) {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      content,
      onCancel: () => resolve(false),
      onOk: () => resolve(true),
      title,
    });
  });
}

async function toggleJob(row: Job | Record<string, any>, checkedValue: unknown) {
  const job = row as Job;
  const checked = checkedValue === true;
  const confirmed = await confirmAction(
    checked ? '启用任务' : '停用任务',
    `确认${checked ? '启用' : '停用'}任务「${job.name}」吗？`,
  );
  if (!confirmed) return;

  try {
    const updated = checked
      ? await enableSchedulerJob(job.code)
      : await disableSchedulerJob(job.code);
    Object.assign(job, updated);
    if (!checked) job.nextRunAt = undefined;
    message.success(checked ? '任务已启用' : '任务已停用');
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function runJob(row: Job | Record<string, any>) {
  const job = row as Job;
  const confirmed = await confirmAction(
    '立即执行任务',
    `确认立即执行任务「${job.name}」吗？`,
  );
  if (!confirmed) return;

  runningCode.value = job.code;
  try {
    await runSchedulerJob(job.code);
    message.success('任务已执行');
    await loadJobs();
    if (activeJob.value?.code === job.code) {
      logsPage.value = 1;
      await loadLogs();
    }
  } catch (error) {
    message.error(getErrorMessage(error));
    if (activeJob.value?.code === job.code) {
      await loadLogs();
    }
  } finally {
    runningCode.value = '';
  }
}

function openLogs(row: Job | Record<string, any>) {
  const job = row as Job;
  activeJob.value = job;
  logsPage.value = 1;
  logsOpen.value = true;
  loadLogs();
}

function showError(error?: string) {
  if (!error) return;
  Modal.info({
    content: h('pre', { class: 'scheduler-error-detail' }, error),
    title: '错误详情',
    width: 720,
  });
}

function resetFilters() {
  enabledFilter.value = 'all';
  statusFilter.value = 'all';
  keyword.value = '';
}

function startTimers() {
  jobsTimer = setInterval(() => {
    if (!editOpen.value && document.visibilityState === 'visible') {
      loadJobs({ silent: true });
    }
  }, 20_000);

  logsTimer = setInterval(() => {
    if (logsOpen.value && document.visibilityState === 'visible') {
      logsPage.value = 1;
      loadLogs({ silent: true });
    }
  }, 10_000);
}

function stopTimers() {
  if (jobsTimer) clearInterval(jobsTimer);
  if (logsTimer) clearInterval(logsTimer);
}

onMounted(() => {
  loadJobs();
  startTimers();
});

onBeforeUnmount(stopTimers);
</script>

<template>
  <Page auto-content-height>
    <div class="scheduler-page">
      <div class="scheduler-toolbar">
        <Space wrap>
          <Button :loading="loading" @click="loadJobs()">
            <IconifyIcon icon="lucide:refresh-cw" />
            刷新
          </Button>
          <Select
            v-model:value="enabledFilter"
            :options="enabledOptions"
            class="scheduler-filter"
          />
          <Select
            v-model:value="statusFilter"
            :options="runStatusOptions"
            class="scheduler-filter"
          />
          <Input
            v-model:value="keyword"
            allow-clear
            class="scheduler-keyword"
            placeholder="搜索任务编码或名称"
          >
            <template #prefix>
              <IconifyIcon icon="lucide:search" />
            </template>
          </Input>
          <Button @click="resetFilters">重置</Button>
        </Space>
      </div>

      <Table
        :columns="jobColumns"
        :data-source="filteredJobs"
        :loading="loading"
        :pagination="{
          current: page,
          pageSize,
          showSizeChanger: true,
          showTotal: (value: number) => `共 ${value} 条`,
          total: keyword || enabledFilter !== 'all' || statusFilter !== 'all'
            ? filteredJobs.length
            : total,
        }"
        row-key="code"
        size="small"
        @change="onJobsTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="scheduler-job-name">{{ record.name }}</div>
            <div class="scheduler-code">{{ record.code }}</div>
          </template>

          <template v-else-if="column.key === 'trigger'">
            <Tag :color="record.triggerType === 'interval' ? 'blue' : 'purple'">
              {{ record.triggerType }}
            </Tag>
            <span>{{ triggerText(record) }}</span>
          </template>

          <template v-else-if="column.key === 'enabled'">
            <Switch
              v-if="can('system:scheduler:update')"
              :checked="record.enabled"
              checked-children="启用"
              un-checked-children="停用"
              @change="(checked) => toggleJob(record, checked)"
            />
            <Tag v-else :color="record.enabled ? 'success' : 'default'">
              {{ record.enabled ? '启用' : '停用' }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'lastStatus'">
            <Tag :color="statusColor(record.lastStatus)">
              {{ statusText(record.lastStatus) }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'lastRunAt'">
            {{ formatTime(record.lastRunAt) }}
          </template>

          <template v-else-if="column.key === 'nextRunAt'">
            {{ record.enabled ? formatTime(record.nextRunAt) : '-' }}
          </template>

          <template v-else-if="column.key === 'configVersion'">
            <span class="scheduler-muted">v{{ record.configVersion }}</span>
          </template>

          <template v-else-if="column.key === 'operation'">
            <Space :size="4">
              <Button
                v-if="can('system:scheduler:update')"
                size="small"
                type="link"
                @click="openEdit(record)"
              >
                编辑
              </Button>
              <Button size="small" type="link" @click="openLogs(record)">
                日志
              </Button>
              <Button
                v-if="can('system:scheduler:run')"
                :loading="runningCode === record.code"
                size="small"
                type="link"
                @click="runJob(record)"
              >
                执行
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </div>

    <Drawer
      v-model:open="editOpen"
      :destroy-on-close="false"
      :width="520"
      title="编辑定时任务"
    >
      <Form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        layout="vertical"
      >
        <Form.Item label="任务编码">
          <Input :value="activeJob?.code" disabled />
        </Form.Item>
        <Form.Item label="任务名称" name="name">
          <Input v-model:value="editForm.name" :maxlength="100" />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Textarea
            v-model:value="editForm.description"
            :maxlength="500"
            :rows="3"
            show-count
          />
        </Form.Item>
        <Form.Item label="触发类型" name="triggerType">
          <RadioGroup
            v-model:value="editForm.triggerType"
            :options="triggerOptions"
            button-style="solid"
            option-type="button"
          />
        </Form.Item>
        <Form.Item
          v-if="editForm.triggerType === 'interval'"
          label="间隔秒数"
          name="intervalSeconds"
        >
          <InputNumber
            v-model:value="editForm.intervalSeconds"
            :min="1"
            class="scheduler-full"
          />
          <div class="scheduler-shortcuts">
            <Button
              v-for="item in intervalShortcuts"
              :key="item.value"
              size="small"
              @click="editForm.intervalSeconds = item.value"
            >
              {{ item.label }}
            </Button>
          </div>
        </Form.Item>
        <Form.Item
          v-else
          label="Cron 表达式"
          name="cronExpression"
          extra="格式：minute hour day month day_of_week，例如 0 2 * * * 表示每天 02:00。"
        >
          <Input
            v-model:value="editForm.cronExpression"
            placeholder="0 2 * * *"
          />
        </Form.Item>
        <div class="scheduler-form-grid">
          <Form.Item label="启用任务" name="enabled">
            <Switch
              v-model:checked="editForm.enabled"
              checked-children="启用"
              un-checked-children="停用"
            />
          </Form.Item>
          <Form.Item label="合并错过触发" name="coalesce">
            <Switch v-model:checked="editForm.coalesce" />
          </Form.Item>
        </div>
        <Form.Item label="最大实例数" name="maxInstances">
          <InputNumber
            v-model:value="editForm.maxInstances"
            :min="1"
            class="scheduler-full"
          />
        </Form.Item>
        <Form.Item label="错过触发宽限秒数" name="misfireGraceSeconds">
          <InputNumber
            v-model:value="editForm.misfireGraceSeconds"
            :min="1"
            class="scheduler-full"
          />
        </Form.Item>
      </Form>

      <template #footer>
        <Space>
          <Button @click="editOpen = false">取消</Button>
          <Button :loading="saving" type="primary" @click="saveJob">
            保存
          </Button>
        </Space>
      </template>
    </Drawer>

    <Drawer
      v-model:open="logsOpen"
      :destroy-on-close="false"
      :width="840"
      title="执行日志"
    >
      <div v-if="activeJob" class="scheduler-log-title">
        <div>{{ activeJob.name }}</div>
        <span>{{ activeJob.code }}</span>
      </div>

      <Table
        :columns="logColumns"
        :data-source="logs"
        :loading="logsLoading"
        :pagination="{
          current: logsPage,
          pageSize: logsPageSize,
          showSizeChanger: true,
          showTotal: (value: number) => `共 ${value} 条`,
          total: logsTotal,
        }"
        row-key="id"
        size="small"
        @change="onLogsTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'startedAt'">
            {{ formatTime(record.startedAt) }}
          </template>
          <template v-else-if="column.key === 'finishedAt'">
            {{ formatTime(record.finishedAt) }}
          </template>
          <template v-else-if="column.key === 'durationMs'">
            {{ formatDuration(record.durationMs) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusColor(record.status)">
              {{ statusText(record.status) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'message'">
            <span class="scheduler-log-message">{{ record.message || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'error'">
            <Button
              v-if="record.error"
              danger
              size="small"
              type="link"
              @click="showError(record.error)"
            >
              查看
            </Button>
            <span v-else>-</span>
          </template>
        </template>
      </Table>
    </Drawer>
  </Page>
</template>

<style scoped>
.scheduler-page {
  min-height: 100%;
  padding: 16px;
  background: hsl(var(--background));
}

.scheduler-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.scheduler-filter {
  width: 132px;
}

.scheduler-keyword {
  width: 260px;
}

.scheduler-job-name {
  font-weight: 600;
  color: hsl(var(--foreground));
}

.scheduler-code,
.scheduler-log-title span,
.scheduler-muted {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.scheduler-full {
  width: 100%;
}

.scheduler-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.scheduler-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.scheduler-log-title {
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid hsl(var(--border));
}

.scheduler-log-title div {
  font-size: 16px;
  font-weight: 600;
}

.scheduler-log-message {
  display: inline-block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .scheduler-keyword,
  .scheduler-filter {
    width: 100%;
  }

  .scheduler-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
.scheduler-error-detail {
  max-height: 420px;
  padding: 12px;
  overflow: auto;
  white-space: pre-wrap;
  background: hsl(var(--muted));
  border-radius: 6px;
}
</style>
