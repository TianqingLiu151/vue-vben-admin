import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import { getDictOptions, getDictOptionsMap } from '#/api/system/dict';

import type { SystemDictApi } from '#/api/system/dict';

const CACHE_TTL = 10 * 60 * 1000;

export const useDictStore = defineStore('dict', () => {
  const optionsMap = ref<Record<string, SystemDictApi.DictOption[]>>({});
  const loadedAtMap = ref<Record<string, number>>({});
  const loadingCodes = ref<string[]>([]);

  const dictOptions = computed(() => optionsMap.value);

  function isFresh(code: string) {
    const loadedAt = loadedAtMap.value[code];
    return loadedAt && Date.now() - loadedAt < CACHE_TTL;
  }

  function markLoading(codes: string[]) {
    loadingCodes.value = Array.from(new Set([...loadingCodes.value, ...codes]));
  }

  function clearLoading(codes: string[]) {
    loadingCodes.value = loadingCodes.value.filter(
      (code) => !codes.includes(code),
    );
  }

  async function loadDict(code: string, force = false) {
    if (!force && isFresh(code)) {
      return optionsMap.value[code] ?? [];
    }

    markLoading([code]);
    try {
      const options = await getDictOptions(code);
      optionsMap.value[code] = options;
      loadedAtMap.value[code] = Date.now();
      return options;
    } finally {
      clearLoading([code]);
    }
  }

  async function loadDicts(codes: string[], force = false) {
    const uniqueCodes = Array.from(new Set(codes.filter(Boolean)));
    const missingCodes = uniqueCodes.filter((code) => force || !isFresh(code));

    if (missingCodes.length === 0) {
      return uniqueCodes.reduce<Record<string, SystemDictApi.DictOption[]>>(
        (map, code) => {
          map[code] = optionsMap.value[code] ?? [];
          return map;
        },
        {},
      );
    }

    markLoading(missingCodes);
    try {
      const loadedOptionsMap = await getDictOptionsMap(missingCodes);
      const now = Date.now();
      missingCodes.forEach((code) => {
        optionsMap.value[code] = loadedOptionsMap[code] ?? [];
        loadedAtMap.value[code] = now;
      });

      return uniqueCodes.reduce<Record<string, SystemDictApi.DictOption[]>>(
        (map, code) => {
          map[code] = optionsMap.value[code] ?? [];
          return map;
        },
        {},
      );
    } finally {
      clearLoading(missingCodes);
    }
  }

  function getDictOption(code: string, value?: null | number | string) {
    if (value === null || value === undefined) return undefined;
    return optionsMap.value[code]?.find((item) => item.value === String(value));
  }

  function getDictLabel(code: string, value?: null | number | string) {
    return getDictOption(code, value)?.label ?? String(value ?? '');
  }

  function clearDictCache(code?: string) {
    if (code) {
      delete optionsMap.value[code];
      delete loadedAtMap.value[code];
      return;
    }

    optionsMap.value = {};
    loadedAtMap.value = {};
  }

  return {
    clearDictCache,
    dictOptions,
    getDictLabel,
    getDictOption,
    loadDict,
    loadDicts,
    loadedAtMap,
    loadingCodes,
    optionsMap,
  };
});
