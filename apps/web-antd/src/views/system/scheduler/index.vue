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
import { $t } from '#/locales';

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

const jobColumns = computed(() => [
  { dataIndex: 'name', key: 'name', title: $t('system.scheduler.name'), width: 260 },
  { dataIndex: 'triggerType', key: 'trigger', title: $t('system.scheduler.triggerRule'), width: 180 },
  { dataIndex: 'enabled', key: 'enabled', title: $t('system.scheduler.enabledStatus'), width: 120 },
  { dataIndex: 'lastStatus', key: 'lastStatus', title: $t('system.scheduler.lastStatus'), width: 120 },
  { dataIndex: 'lastRunAt', key: 'lastRunAt', title: $t('system.scheduler.lastRunAt'), width: 180 },
  { dataIndex: 'nextRunAt', key: 'nextRunAt', title: $t('system.scheduler.nextRunAt'), width: 180 },
  { dataIndex: 'configVersion', key: 'configVersion', title: $t('system.scheduler.configVersion'), width: 100 },
  { key: 'operation', title: $t('system.scheduler.operation'), width: 230 },
]);

const logColumns = computed(() => [
  { dataIndex: 'startedAt', key: 'startedAt', title: $t('system.scheduler.startedAt'), width: 180 },
  { dataIndex: 'finishedAt', key: 'finishedAt', title: $t('system.scheduler.finishedAt'), width: 180 },
  { dataIndex: 'durationMs', key: 'durationMs', title: $t('system.scheduler.duration'), width: 100 },
  { dataIndex: 'status', key: 'status', title: $t('system.scheduler.status'), width: 100 },
  { dataIndex: 'message', key: 'message', title: $t('system.scheduler.message') },
  { dataIndex: 'error', key: 'error', title: $t('system.scheduler.error'), width: 100 },
]);

const enabledOptions = computed(() => [
  { label: $t('system.scheduler.allStatus'), value: 'all' },
  { label: $t('system.scheduler.enabled'), value: 'enabled' },
  { label: $t('system.scheduler.disabled'), value: 'disabled' },
]);

const runStatusOptions = computed(() => [
  { label: $t('system.scheduler.allResults'), value: 'all' },
  { label: $t('system.scheduler.success'), value: 'success' },
  { label: $t('system.scheduler.failed'), value: 'failed' },
  { label: $t('system.scheduler.skipped'), value: 'skipped' },
]);

const triggerOptions = computed(() => [
  { label: $t('system.scheduler.intervalTrigger'), value: 'interval' },
  { label: $t('system.scheduler.cronTrigger'), value: 'cron' },
]);

const intervalShortcuts = computed(() => [
  { label: $t('system.scheduler.second5'), value: 5 },
  { label: $t('system.scheduler.second30'), value: 30 },
  { label: $t('system.scheduler.minute1'), value: 60 },
  { label: $t('system.scheduler.minute5'), value: 300 },
  { label: $t('system.scheduler.minute10'), value: 600 },
  { label: $t('system.scheduler.hour1'), value: 3600 },
]);

const editRules = computed<Record<string, any[]>>(() => ({
  cronExpression:
    editForm.triggerType === 'cron'
      ? [{ message: $t('system.scheduler.rules.cronExpression'), required: true, trigger: 'blur' }]
      : [],
  intervalSeconds:
    editForm.triggerType === 'interval'
      ? [{ message: $t('system.scheduler.rules.intervalSeconds'), required: true, trigger: 'change' }]
      : [],
  maxInstances: [{ message: $t('system.scheduler.rules.maxInstances'), required: true, trigger: 'change' }],
  misfireGraceSeconds: [
    { message: $t('system.scheduler.rules.misfireGraceSeconds'), required: true, trigger: 'change' },
  ],
  name: [
    { message: $t('system.scheduler.rules.name'), required: true, trigger: 'blur' },
    { max: 100, message: $t('system.scheduler.rules.nameMax'), trigger: 'blur' },
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
    return $t('system.scheduler.everySeconds', [job.intervalSeconds ?? '-']);
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
    failed: $t('system.scheduler.failed'),
    skipped: $t('system.scheduler.skipped'),
    success: $t('system.scheduler.success'),
  };
  return status ? labels[status] : $t('system.scheduler.none');
}

function getErrorMessage(error: any) {
  const data = error?.response?.data ?? {};
  return data.detail ?? data.error ?? data.message ?? error?.message ?? $t('system.scheduler.operationFailed');
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
    message.success($t('system.scheduler.saveSuccess'));
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
    checked ? $t('system.scheduler.enableJob') : $t('system.scheduler.disableJob'),
    $t('system.scheduler.toggleConfirm', [
      checked ? $t('system.scheduler.enabled') : $t('system.scheduler.disabled'),
      job.name,
    ]),
  );
  if (!confirmed) return;

  try {
    const updated = checked
      ? await enableSchedulerJob(job.code)
      : await disableSchedulerJob(job.code);
    Object.assign(job, updated);
    if (!checked) job.nextRunAt = undefined;
    message.success(
      checked ? $t('system.scheduler.enableSuccess') : $t('system.scheduler.disableSuccess'),
    );
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}

async function runJob(row: Job | Record<string, any>) {
  const job = row as Job;
  const confirmed = await confirmAction(
    $t('system.scheduler.runJob'),
    $t('system.scheduler.runConfirm', [job.name]),
  );
  if (!confirmed) return;

  runningCode.value = job.code;
  try {
    await runSchedulerJob(job.code);
    message.success($t('system.scheduler.runSuccess'));
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
    title: $t('system.scheduler.errorDetail'),
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
            {{ $t('system.scheduler.refresh') }}
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
            :placeholder="$t('system.scheduler.keywordPlaceholder')"
          >
            <template #prefix>
              <IconifyIcon icon="lucide:search" />
            </template>
          </Input>
          <Button @click="resetFilters">{{ $t('system.scheduler.reset') }}</Button>
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
          showTotal: (value: number) => $t('system.scheduler.total', [value]),
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
              :checked-children="$t('system.scheduler.enabled')"
              :un-checked-children="$t('system.scheduler.disabled')"
              @change="(checked) => toggleJob(record, checked)"
            />
            <Tag v-else :color="record.enabled ? 'success' : 'default'">
              {{
                record.enabled
                  ? $t('system.scheduler.enabled')
                  : $t('system.scheduler.disabled')
              }}
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
                {{ $t('system.scheduler.edit') }}
              </Button>
              <Button size="small" type="link" @click="openLogs(record)">
                {{ $t('system.scheduler.logs') }}
              </Button>
              <Button
                v-if="can('system:scheduler:run')"
                :loading="runningCode === record.code"
                size="small"
                type="link"
                @click="runJob(record)"
              >
                {{ $t('system.scheduler.run') }}
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
      :title="$t('system.scheduler.editTitle')"
    >
      <Form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        layout="vertical"
      >
        <Form.Item :label="$t('system.scheduler.code')">
          <Input :value="activeJob?.code" disabled />
        </Form.Item>
        <Form.Item :label="$t('system.scheduler.name')" name="name">
          <Input v-model:value="editForm.name" :maxlength="100" />
        </Form.Item>
        <Form.Item :label="$t('system.scheduler.description')" name="description">
          <Textarea
            v-model:value="editForm.description"
            :maxlength="500"
            :rows="3"
            show-count
          />
        </Form.Item>
        <Form.Item :label="$t('system.scheduler.triggerType')" name="triggerType">
          <RadioGroup
            v-model:value="editForm.triggerType"
            :options="triggerOptions"
            button-style="solid"
            option-type="button"
          />
        </Form.Item>
        <Form.Item
          v-if="editForm.triggerType === 'interval'"
          :label="$t('system.scheduler.intervalSeconds')"
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
          :label="$t('system.scheduler.cronExpression')"
          name="cronExpression"
          :extra="$t('system.scheduler.cronHelp')"
        >
          <Input
            v-model:value="editForm.cronExpression"
            placeholder="0 2 * * *"
          />
        </Form.Item>
        <div class="scheduler-form-grid">
          <Form.Item :label="$t('system.scheduler.enableJob')" name="enabled">
            <Switch
              v-model:checked="editForm.enabled"
              :checked-children="$t('system.scheduler.enabled')"
              :un-checked-children="$t('system.scheduler.disabled')"
            />
          </Form.Item>
          <Form.Item :label="$t('system.scheduler.coalesce')" name="coalesce">
            <Switch v-model:checked="editForm.coalesce" />
          </Form.Item>
        </div>
        <Form.Item :label="$t('system.scheduler.maxInstances')" name="maxInstances">
          <InputNumber
            v-model:value="editForm.maxInstances"
            :min="1"
            class="scheduler-full"
          />
        </Form.Item>
        <Form.Item
          :label="$t('system.scheduler.misfireGraceSeconds')"
          name="misfireGraceSeconds"
        >
          <InputNumber
            v-model:value="editForm.misfireGraceSeconds"
            :min="1"
            class="scheduler-full"
          />
        </Form.Item>
      </Form>

      <template #footer>
        <Space>
          <Button @click="editOpen = false">
            {{ $t('system.scheduler.cancel') }}
          </Button>
          <Button :loading="saving" type="primary" @click="saveJob">
            {{ $t('system.scheduler.save') }}
          </Button>
        </Space>
      </template>
    </Drawer>

    <Drawer
      v-model:open="logsOpen"
      :destroy-on-close="false"
      :width="840"
      :title="$t('system.scheduler.executionLogs')"
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
          showTotal: (value: number) => $t('system.scheduler.total', [value]),
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
              {{ $t('system.scheduler.view') }}
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
