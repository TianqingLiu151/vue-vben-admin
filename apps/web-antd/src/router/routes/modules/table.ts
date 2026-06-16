import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:table-2',
      order: 20,
      title: $t('table.title'),
    },
    name: 'Table',
    path: '/table',
    children: [
      {
        component: () => import('#/views/table/basic/index.vue'),
        meta: {
          authority: ['table:list'],
          icon: 'lucide:table-properties',
          title: $t('table.basic'),
        },
        name: 'TableBasic',
        path: '/table/basic',
      },
    ],
  },
];

export default routes;
