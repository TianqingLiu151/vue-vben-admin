import { requestClient } from '#/api/request';

interface TimezoneOption {
  label: string;
  value: string;
}

/**
 * Get system timezone.
 */
export async function getSystemTimezoneApi(): Promise<
  null | string | undefined
> {
  return requestClient.get<null | string | undefined>('/timezone');
}

/**
 * Set system timezone.
 */
export async function setSystemTimezoneApi(timezone: string): Promise<void> {
  return requestClient.post('/timezone', { timezone });
}

/**
 * Get timezone options.
 */
export async function getTimezoneOptionsApi() {
  return requestClient.get<TimezoneOption[]>('/timezone/options');
}

/**
 * Get user timezone.
 */
export async function getTimezoneApi(): Promise<null | string | undefined> {
  return requestClient.get<null | string | undefined>('/user/timezone');
}

/**
 * Set user timezone.
 */
export async function setTimezoneApi(timezone: string): Promise<void> {
  return requestClient.post('/user/timezone', { timezone });
}
