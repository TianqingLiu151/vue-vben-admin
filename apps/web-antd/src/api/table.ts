import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ProductTableApi {
  export interface Product {
    available: boolean;
    category?: string;
    color?: string;
    createdAt?: string;
    currency?: string;
    description?: string;
    deptId?: string;
    id: string;
    imageUrl?: string;
    imageUrl2?: string;
    inProduction: boolean;
    isOpen: boolean;
    ownerId?: number;
    price?: number;
    productName: string;
    quantity?: number;
    rating?: number;
    releaseDate?: string;
    status: string;
    tags?: string[];
    weight?: number;
  }

  export type ProductPayload = Omit<Product, 'createdAt' | 'id'>;
}

export async function getTableList(params: Recordable<any>) {
  return requestClient.get<{
    items: ProductTableApi.Product[];
    page: number;
    pageSize: number;
    total: number;
  }>('/table/list', { params });
}

export async function createTableItem(data: ProductTableApi.ProductPayload) {
  return requestClient.post('/table', data);
}

export async function updateTableItem(
  id: string,
  data: Partial<ProductTableApi.ProductPayload>,
) {
  return requestClient.put(`/table/${id}`, data);
}

export async function deleteTableItem(id: string) {
  return requestClient.delete(`/table/${id}`);
}
