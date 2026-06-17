<script lang="ts" setup>
import type { FormInstance, TablePaginationConfig } from 'ant-design-vue';

import type { SystemDictApi } from '#/api/system/dict';

import { computed, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import {
  Button,
  Drawer,
  Empty,
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
  createDictItem,
  createDictType,
  deleteDictItem,
  deleteDictType,
  getDictItemList,
  getDictTypeList,
  updateDictItem,
  updateDictType,
} from '#/api/system/dict';
import { $t } from '#/locales';
import { useDictStore } from '#/store';

type DictType = SystemDictApi.DictTypeItem;
type DictItem = SystemDictApi.DictItemItem;
type FormMode = 'create' | 'edit';

const { hasAccessByCodes } = useAccess();
const dictStore = useDictStore();

const typeLoading = ref(false);
const itemLoading = ref(false);
const saving = ref(false);
const selectedType = ref<DictType>();

const typeList = ref<DictType[]>([]);
const typeTotal = ref(0);
const typePage = ref(1);
const typePageSize = ref(10);

const itemList = ref<DictItem[]>([]);
const itemTotal = ref(0);
const itemPage = ref(1);
const itemPageSize = ref(10);

const typeDrawerOpen = ref(false);
const itemDrawerOpen = ref(false);
const typeFormRef = ref<FormInstance>();
const itemFormRef = ref<FormInstance>();
const typeFormMode = ref<FormMode>('create');
const itemFormMode = ref<FormMode>('create');
const editingType = ref<DictType>();
const editingItem = ref<DictItem>();

const typeFilters = reactive({
  code: '',
  name: '',
  status: undefined as number | undefined,
});

const itemFilters = reactive({
  label: '',
  status: undefined as number | undefined,
});

const typeForm = reactive<SystemDictApi.DictTypeForm>({
  code: '',
  name: '',
  remark: '',
  status: 1,
});

const itemForm = reactive<SystemDictApi.DictItemForm>({
  color: 'default',
  cssClass: '',
  dictCode: '',
  isDefault: false,
  label: '',
  remark: '',
  sort: 0,
  status: 1,
  value: '',
});

const statusOptions = computed(() => [
  { label: $t('system.dict.allStatus'), value: undefined },
  { label: $t('common.enabled'), value: 1 },
  { label: $t('common.disabled'), value: 0 },
]);

const enabledOptions = computed(() => [
  { label: $t('common.enabled'), value: 1 },
  { label: $t('common.disabled'), value: 0 },
]);

const colorOptions = computed(() =>
  ['default', 'primary', 'success', 'warning', 'error', 'processing'].map(
    (value) => ({
      label: $t(`system.dict.colors.${value}`),
      value,
    }),
  ),
);

const typeColumns = computed(() => [
  { dataIndex: 'name', key: 'name', title: $t('system.dict.typeName'), width: 180 },
  { dataIndex: 'code', key: 'code', title: $t('system.dict.typeCode'), width: 170 },
  { dataIndex: 'status', key: 'status', title: $t('system.dict.status'), width: 100 },
  { dataIndex: 'remark', key: 'remark', title: $t('system.dict.remark') },
  { dataIndex: 'createdAt', key: 'createdAt', title: $t('system.dict.createTime'), width: 170 },
  { key: 'operation', title: $t('system.dict.operation'), width: 150 },
]);

const itemColumns = computed(() => [
  { dataIndex: 'label', key: 'label', title: $t('system.dict.itemLabel'), width: 180 },
  { dataIndex: 'value', key: 'value', title: $t('system.dict.itemValue'), width: 130 },
  { dataIndex: 'color', key: 'color', title: $t('system.dict.color'), width: 130 },
  { dataIndex: 'sort', key: 'sort', title: $t('system.dict.sort'), width: 90 },
  { dataIndex: 'isDefault', key: 'isDefault', title: $t('system.dict.defaultItem'), width: 110 },
  { dataIndex: 'status', key: 'status', title: $t('system.dict.status'), width: 100 },
  { dataIndex: 'remark', key: 'remark', title: $t('system.dict.remark') },
  { key: 'operation', title: $t('system.dict.operation'), width: 150 },
]);

const typeRules = computed<Record<string, any[]>>(() => ({
  code: [
    { message: $t('system.dict.rules.typeCode'), required: true, trigger: 'blur' },
    { max: 100, message: $t('system.dict.rules.max100'), trigger: 'blur' },
    {
      message: $t('system.dict.rules.codePattern'),
      pattern: /^[a-z0-9_]+$/,
      trigger: 'blur',
    },
  ],
  name: [
    { message: $t('system.dict.rules.typeName'), required: true, trigger: 'blur' },
    { max: 100, message: $t('system.dict.rules.max100'), trigger: 'blur' },
  ],
  remark: [{ max: 500, message: $t('system.dict.rules.max500'), trigger: 'blur' }],
}));

const itemRules = computed<Record<string, any[]>>(() => ({
  cssClass: [{ max: 100, message: $t('system.dict.rules.max100'), trigger: 'blur' }],
  dictCode: [{ message: $t('system.dict.rules.dictCode'), required: true, trigger: 'change' }],
  label: [
    { message: $t('system.dict.rules.itemLabel'), required: true, trigger: 'blur' },
    { max: 100, message: $t('system.dict.rules.max100'), trigger: 'blur' },
  ],
  remark: [{ max: 500, message: $t('system.dict.rules.max500'), trigger: 'blur' }],
  value: [
    { message: $t('system.dict.rules.itemValue'), required: true, trigger: 'blur' },
    { max: 100, message: $t('system.dict.rules.max100'), trigger: 'blur' },
  ],
}));

function can(code: string) {
  return hasAccessByCodes([code]);
}

function formatTime(value?: string) {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : value;
}

function getErrorMessage(error: any) {
  const data = error?.response?.data ?? {};
  return data.detail ?? data.error ?? data.message ?? error?.message ?? $t('system.dict.operationFailed');
}

function toPayloadString(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function resetTypeForm() {
  Object.assign(typeForm, {
    code: '',
    name: '',
    remark: '',
    status: 1,
  });
}

function resetItemForm() {
  Object.assign(itemForm, {
    color: 'default',
    cssClass: '',
    dictCode: selectedType.value?.code ?? '',
    isDefault: false,
    label: '',
    remark: '',
    sort: 0,
    status: 1,
    value: '',
  });
}

async function loadTypes(options?: { keepSelection?: boolean }) {
  typeLoading.value = true;
  try {
    const res = await getDictTypeList({
      code: toPayloadString(typeFilters.code),
      name: toPayloadString(typeFilters.name),
      page: typePage.value,
      pageSize: typePageSize.value,
      status: typeFilters.status,
    });
    typeList.value = res.items;
    typeTotal.value = res.total;

    const previousCode = selectedType.value?.code;
    const matched = options?.keepSelection
      ? res.items.find((item) => item.code === previousCode)
      : undefined;
    selectedType.value = matched ?? res.items[0];
    itemPage.value = 1;
    await loadItems();
  } finally {
    typeLoading.value = false;
  }
}

async function loadItems() {
  if (!selectedType.value) {
    itemList.value = [];
    itemTotal.value = 0;
    return;
  }

  itemLoading.value = true;
  try {
    const res = await getDictItemList({
      dictCode: selectedType.value.code,
      label: toPayloadString(itemFilters.label),
      page: itemPage.value,
      pageSize: itemPageSize.value,
      status: itemFilters.status,
    });
    itemList.value = res.items;
    itemTotal.value = res.total;
  } finally {
    itemLoading.value = false;
  }
}

function onTypeTableChange(pagination: TablePaginationConfig) {
  typePage.value = pagination.current ?? 1;
  typePageSize.value = pagination.pageSize ?? 10;
  loadTypes({ keepSelection: true });
}

function onItemTableChange(pagination: TablePaginationConfig) {
  itemPage.value = pagination.current ?? 1;
  itemPageSize.value = pagination.pageSize ?? 10;
  loadItems();
}

function selectType(row: DictType) {
  selectedType.value = row;
  itemPage.value = 1;
  loadItems();
}

function searchTypes() {
  typePage.value = 1;
  loadTypes({ keepSelection: true });
}

function resetTypeFilters() {
  Object.assign(typeFilters, {
    code: '',
    name: '',
    status: undefined,
  });
  searchTypes();
}

function searchItems() {
  itemPage.value = 1;
  loadItems();
}

function resetItemFilters() {
  Object.assign(itemFilters, {
    label: '',
    status: undefined,
  });
  searchItems();
}

function openCreateType() {
  typeFormMode.value = 'create';
  editingType.value = undefined;
  resetTypeForm();
  typeDrawerOpen.value = true;
}

function openEditType(row: DictType | Record<string, any>) {
  const dictType = row as DictType;
  typeFormMode.value = 'edit';
  editingType.value = dictType;
  Object.assign(typeForm, {
    code: dictType.code,
    name: dictType.name,
    remark: dictType.remark ?? '',
    status: dictType.status,
  });
  typeDrawerOpen.value = true;
}

function openCreateItem() {
  if (!selectedType.value) return;
  itemFormMode.value = 'create';
  editingItem.value = undefined;
  resetItemForm();
  itemDrawerOpen.value = true;
}

function openEditItem(row: DictItem | Record<string, any>) {
  const dictItem = row as DictItem;
  itemFormMode.value = 'edit';
  editingItem.value = dictItem;
  Object.assign(itemForm, {
    color: dictItem.color ?? 'default',
    cssClass: dictItem.cssClass ?? '',
    dictCode: dictItem.dictCode,
    isDefault: dictItem.isDefault,
    label: dictItem.label,
    remark: dictItem.remark ?? '',
    sort: dictItem.sort,
    status: dictItem.status,
    value: dictItem.value,
  });
  itemDrawerOpen.value = true;
}

async function saveType() {
  await typeFormRef.value?.validate();
  saving.value = true;
  try {
    const payload: SystemDictApi.DictTypeForm = {
      code: toPayloadString(typeForm.code),
      name: toPayloadString(typeForm.name),
      remark: toPayloadString(typeForm.remark),
      status: typeForm.status ?? 1,
    };

    if (typeFormMode.value === 'edit' && editingType.value) {
      await updateDictType(editingType.value.id, payload);
      dictStore.clearDictCache(editingType.value.code);
      if (payload.code && editingType.value.code !== payload.code) {
        dictStore.clearDictCache(payload.code);
      }
    } else {
      await createDictType(payload);
    }

    message.success($t('system.dict.saveSuccess'));
    typeDrawerOpen.value = false;
    await loadTypes({ keepSelection: true });
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function saveItem() {
  await itemFormRef.value?.validate();
  saving.value = true;
  try {
    const payload: SystemDictApi.DictItemForm = {
      color: itemForm.color === 'default' ? undefined : itemForm.color,
      cssClass: toPayloadString(itemForm.cssClass),
      dictCode: itemForm.dictCode,
      isDefault: itemForm.isDefault ?? false,
      label: toPayloadString(itemForm.label),
      remark: toPayloadString(itemForm.remark),
      sort: itemForm.sort ?? 0,
      status: itemForm.status ?? 1,
      value: toPayloadString(itemForm.value),
    };

    if (itemFormMode.value === 'edit' && editingItem.value) {
      await updateDictItem(editingItem.value.id, payload);
    } else {
      await createDictItem(payload);
    }

    if (payload.dictCode) {
      dictStore.clearDictCache(payload.dictCode);
    }
    message.success($t('system.dict.saveSuccess'));
    itemDrawerOpen.value = false;
    await loadItems();
  } catch (error) {
    message.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

function confirmDeleteType(row: DictType | Record<string, any>) {
  const dictType = row as DictType;
  Modal.confirm({
    content: $t('system.dict.deleteTypeConfirm', [dictType.name]),
    onOk: async () => {
      try {
        await deleteDictType(dictType.id);
        dictStore.clearDictCache(dictType.code);
        message.success($t('system.dict.deleteSuccess'));
        await loadTypes({ keepSelection: true });
      } catch (error) {
        message.error(getErrorMessage(error));
      }
    },
    title: $t('system.dict.deleteType'),
  });
}

function confirmDeleteItem(row: DictItem | Record<string, any>) {
  const dictItem = row as DictItem;
  Modal.confirm({
    content: $t('system.dict.deleteItemConfirm', [dictItem.label]),
    onOk: async () => {
      try {
        await deleteDictItem(dictItem.id);
        dictStore.clearDictCache(dictItem.dictCode);
        message.success($t('system.dict.deleteSuccess'));
        await loadItems();
      } catch (error) {
        message.error(getErrorMessage(error));
      }
    },
    title: $t('system.dict.deleteItem'),
  });
}

function statusColor(status?: number) {
  return status === 1 ? 'success' : 'default';
}

function tagColor(color?: string) {
  const colorMap: Record<string, string> = {
    default: 'default',
    error: 'error',
    primary: 'blue',
    processing: 'processing',
    success: 'success',
    warning: 'warning',
  };
  return colorMap[color || 'default'] ?? color;
}

onMounted(() => {
  loadTypes();
});
</script>

<template>
  <Page auto-content-height>
    <div class="dict-page">
      <div class="dict-pane dict-type-pane">
        <div class="dict-toolbar">
          <Space wrap>
            <Input
              v-model:value="typeFilters.name"
              allow-clear
              class="dict-filter"
              :placeholder="$t('system.dict.typeName')"
              @press-enter="searchTypes"
            />
            <Input
              v-model:value="typeFilters.code"
              allow-clear
              class="dict-filter"
              :placeholder="$t('system.dict.typeCode')"
              @press-enter="searchTypes"
            />
            <Select
              v-model:value="typeFilters.status"
              allow-clear
              class="dict-status-filter"
              :options="statusOptions"
              :placeholder="$t('system.dict.status')"
            />
            <Button :loading="typeLoading" @click="searchTypes">
              <IconifyIcon icon="lucide:search" />
              {{ $t('common.query') }}
            </Button>
            <Button @click="resetTypeFilters">
              {{ $t('system.dict.reset') }}
            </Button>
          </Space>
          <Button
            v-if="can('system:dict:create')"
            type="primary"
            @click="openCreateType"
          >
            <Plus class="size-5" />
            {{ $t('system.dict.createType') }}
          </Button>
        </div>

        <Table
          :columns="typeColumns"
          :custom-row="
            (record) => ({
              class: record.code === selectedType?.code ? 'dict-row-active' : '',
              onClick: () => selectType(record),
            })
          "
          :data-source="typeList"
          :loading="typeLoading"
          :pagination="{
            current: typePage,
            pageSize: typePageSize,
            showSizeChanger: true,
            showTotal: (value: number) => $t('system.dict.total', [value]),
            total: typeTotal,
          }"
          row-key="id"
          size="small"
          @change="onTypeTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'code'">
              <span class="dict-code">{{ record.code }}</span>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="statusColor(record.status)">
                {{
                  record.status === 1 ? $t('common.enabled') : $t('common.disabled')
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'remark'">
              <span class="dict-ellipsis">{{ record.remark || '-' }}</span>
            </template>
            <template v-else-if="column.key === 'createdAt'">
              {{ formatTime(record.createdAt) }}
            </template>
            <template v-else-if="column.key === 'operation'">
              <Space :size="4">
                <Button
                  v-if="can('system:dict:update')"
                  size="small"
                  type="link"
                  @click.stop="openEditType(record)"
                >
                  {{ $t('common.edit') }}
                </Button>
                <Button
                  v-if="can('system:dict:delete')"
                  danger
                  size="small"
                  type="link"
                  @click.stop="confirmDeleteType(record)"
                >
                  {{ $t('common.delete') }}
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </div>

      <div class="dict-pane dict-item-pane">
        <div class="dict-item-header">
          <div>
            <div class="dict-item-title">
              {{ selectedType?.name || $t('system.dict.noSelectedType') }}
            </div>
            <div v-if="selectedType" class="dict-code">
              {{ selectedType.code }}
            </div>
          </div>
          <Button
            v-if="can('system:dict:create')"
            :disabled="!selectedType"
            type="primary"
            @click="openCreateItem"
          >
            <Plus class="size-5" />
            {{ $t('system.dict.createItem') }}
          </Button>
        </div>

        <template v-if="selectedType">
          <div class="dict-toolbar">
            <Space wrap>
              <Input
                v-model:value="itemFilters.label"
                allow-clear
                class="dict-filter"
                :placeholder="$t('system.dict.itemLabel')"
                @press-enter="searchItems"
              />
              <Select
                v-model:value="itemFilters.status"
                allow-clear
                class="dict-status-filter"
                :options="statusOptions"
                :placeholder="$t('system.dict.status')"
              />
              <Button :loading="itemLoading" @click="searchItems">
                <IconifyIcon icon="lucide:search" />
                {{ $t('common.query') }}
              </Button>
              <Button @click="resetItemFilters">
                {{ $t('system.dict.reset') }}
              </Button>
            </Space>
          </div>

          <Table
            :columns="itemColumns"
            :data-source="itemList"
            :loading="itemLoading"
            :locale="{ emptyText: $t('system.dict.emptyItems') }"
            :pagination="{
              current: itemPage,
              pageSize: itemPageSize,
              showSizeChanger: true,
              showTotal: (value: number) => $t('system.dict.total', [value]),
              total: itemTotal,
            }"
            row-key="id"
            size="small"
            @change="onItemTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'value'">
                <span class="dict-code">{{ record.value }}</span>
              </template>
              <template v-else-if="column.key === 'color'">
                <Tag :color="tagColor(record.color)">
                  {{ record.color || 'default' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'isDefault'">
                <Tag v-if="record.isDefault" color="processing">
                  {{ $t('system.dict.defaultItem') }}
                </Tag>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="statusColor(record.status)">
                  {{
                    record.status === 1
                      ? $t('common.enabled')
                      : $t('common.disabled')
                  }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'remark'">
                <span class="dict-ellipsis">{{ record.remark || '-' }}</span>
              </template>
              <template v-else-if="column.key === 'operation'">
                <Space :size="4">
                  <Button
                    v-if="can('system:dict:update')"
                    size="small"
                    type="link"
                    @click="openEditItem(record)"
                  >
                    {{ $t('common.edit') }}
                  </Button>
                  <Button
                    v-if="can('system:dict:delete')"
                    danger
                    size="small"
                    type="link"
                    @click="confirmDeleteItem(record)"
                  >
                    {{ $t('common.delete') }}
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </template>

        <Empty
          v-else
          class="dict-empty"
          :description="$t('system.dict.noSelectedTypeHelp')"
        />
      </div>
    </div>

    <Drawer
      v-model:open="typeDrawerOpen"
      :title="
        typeFormMode === 'edit'
          ? $t('system.dict.editType')
          : $t('system.dict.createType')
      "
      :width="520"
      destroy-on-close
    >
      <Form
        ref="typeFormRef"
        :model="typeForm"
        :rules="typeRules"
        layout="vertical"
      >
        <Form.Item :label="$t('system.dict.typeName')" name="name">
          <Input v-model:value="typeForm.name" :maxlength="100" />
        </Form.Item>
        <Form.Item :label="$t('system.dict.typeCode')" name="code">
          <Input
            v-model:value="typeForm.code"
            :disabled="typeFormMode === 'edit'"
            :maxlength="100"
          />
        </Form.Item>
        <Form.Item :label="$t('system.dict.status')" name="status">
          <RadioGroup
            v-model:value="typeForm.status"
            :options="enabledOptions"
            button-style="solid"
            option-type="button"
          />
        </Form.Item>
        <Form.Item :label="$t('system.dict.remark')" name="remark">
          <Textarea
            v-model:value="typeForm.remark"
            :maxlength="500"
            :rows="4"
            show-count
          />
        </Form.Item>
      </Form>

      <template #footer>
        <Space>
          <Button @click="typeDrawerOpen = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button :loading="saving" type="primary" @click="saveType">
            {{ $t('system.dict.save') }}
          </Button>
        </Space>
      </template>
    </Drawer>

    <Drawer
      v-model:open="itemDrawerOpen"
      :title="
        itemFormMode === 'edit'
          ? $t('system.dict.editItem')
          : $t('system.dict.createItem')
      "
      :width="560"
      destroy-on-close
    >
      <Form
        ref="itemFormRef"
        :model="itemForm"
        :rules="itemRules"
        layout="vertical"
      >
        <Form.Item :label="$t('system.dict.typeCode')" name="dictCode">
          <Input v-model:value="itemForm.dictCode" disabled />
        </Form.Item>
        <div class="dict-form-grid">
          <Form.Item :label="$t('system.dict.itemLabel')" name="label">
            <Input v-model:value="itemForm.label" :maxlength="100" />
          </Form.Item>
          <Form.Item :label="$t('system.dict.itemValue')" name="value">
            <Input v-model:value="itemForm.value" :maxlength="100" />
          </Form.Item>
        </div>
        <div class="dict-form-grid">
          <Form.Item :label="$t('system.dict.color')" name="color">
            <Select v-model:value="itemForm.color" :options="colorOptions">
              <template #option="{ label, value }">
                <Tag :color="tagColor(value)">{{ label }}</Tag>
              </template>
            </Select>
          </Form.Item>
          <Form.Item :label="$t('system.dict.sort')" name="sort">
            <InputNumber
              v-model:value="itemForm.sort"
              :min="0"
              class="dict-full"
            />
          </Form.Item>
        </div>
        <div class="dict-form-grid">
          <Form.Item :label="$t('system.dict.status')" name="status">
            <RadioGroup
              v-model:value="itemForm.status"
              :options="enabledOptions"
              button-style="solid"
              option-type="button"
            />
          </Form.Item>
          <Form.Item :label="$t('system.dict.defaultItem')" name="isDefault">
            <Switch v-model:checked="itemForm.isDefault" />
          </Form.Item>
        </div>
        <Form.Item :label="$t('system.dict.cssClass')" name="cssClass">
          <Input v-model:value="itemForm.cssClass" :maxlength="100" />
        </Form.Item>
        <Form.Item :label="$t('system.dict.remark')" name="remark">
          <Textarea
            v-model:value="itemForm.remark"
            :maxlength="500"
            :rows="4"
            show-count
          />
        </Form.Item>
        <div class="dict-color-preview">
          <span>{{ $t('system.dict.colorPreview') }}</span>
          <Tag :color="tagColor(itemForm.color)">
            {{ itemForm.label || itemForm.value || 'Tag' }}
          </Tag>
        </div>
      </Form>

      <template #footer>
        <Space>
          <Button @click="itemDrawerOpen = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button :loading="saving" type="primary" @click="saveItem">
            {{ $t('system.dict.save') }}
          </Button>
        </Space>
      </template>
    </Drawer>
  </Page>
</template>

<style scoped>
.dict-page {
  display: grid;
  grid-template-columns: minmax(520px, 0.9fr) minmax(560px, 1.1fr);
  gap: 12px;
  min-height: 100%;
  padding: 16px;
  overflow: auto;
  background: hsl(var(--background));
}

.dict-pane {
  min-width: 0;
  padding: 12px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.dict-toolbar,
.dict-item-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dict-filter {
  width: 160px;
}

.dict-status-filter {
  width: 120px;
}

.dict-item-title {
  font-size: 16px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.dict-code {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.dict-ellipsis {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
}

.dict-empty {
  padding: 96px 0;
}

.dict-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.dict-full {
  width: 100%;
}

.dict-color-preview {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  background: hsl(var(--muted));
  border-radius: 6px;
}

:deep(.dict-row-active > td) {
  background: hsl(var(--accent));
}

@media (max-width: 1280px) {
  .dict-page {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dict-filter,
  .dict-status-filter {
    width: 100%;
  }

  .dict-toolbar,
  .dict-item-header {
    align-items: stretch;
    flex-direction: column;
  }

  .dict-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
