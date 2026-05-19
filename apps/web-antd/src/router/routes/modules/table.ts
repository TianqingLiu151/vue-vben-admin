import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:table-2',
      order: 20,
      title: '表格管理',
    },
    name: 'Table',
    path: '/table',
    children: [
      {
        component: () => import('#/views/table/basic/index.vue'),
        meta: {
          authority: ['demo:table:list'],
          icon: 'lucide:table-properties',
          title: '基础表格',
        },
        name: 'TableBasic',
        path: '/table/basic',
      },
    ],
  },
];

export default routes;
