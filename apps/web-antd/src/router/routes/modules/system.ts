import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 10,
      title: $t('system.title'),
    },
    name: 'System',
    path: '/system',
    children: [
      {
        component: () => import('#/views/system/user/list.vue'),
        meta: {
          authority: ['system:user:list'],
          icon: 'lucide:users',
          title: $t('system.user.title'),
        },
        name: 'SystemUser',
        path: '/system/user',
      },
      {
        component: () => import('#/views/system/role/list.vue'),
        meta: {
          authority: ['system:role:list'],
          icon: 'lucide:shield-check',
          title: $t('system.role.title'),
        },
        name: 'SystemRole',
        path: '/system/role',
      },
      {
        component: () => import('#/views/system/menu/list.vue'),
        meta: {
          authority: ['system:menu:list'],
          icon: 'lucide:menu',
          title: $t('system.menu.title'),
        },
        name: 'SystemMenu',
        path: '/system/menu',
      },
      {
        component: () => import('#/views/system/dept/list.vue'),
        meta: {
          authority: ['system:dept:list'],
          icon: 'lucide:building-2',
          title: $t('system.dept.title'),
        },
        name: 'SystemDept',
        path: '/system/dept',
      },
      {
        component: () => import('#/views/system/dict/list.vue'),
        meta: {
          authority: ['system:dict:list'],
          icon: 'lucide:book-open',
          title: $t('system.dict.title'),
        },
        name: 'SystemDict',
        path: '/system/dict',
      },
      {
        component: () => import('#/views/system/scheduler/index.vue'),
        meta: {
          authority: ['system:scheduler:list'],
          icon: 'lucide:timer',
          title: $t('system.scheduler.title'),
        },
        name: 'SystemScheduler',
        path: '/system/scheduler',
      },
      {
        component: () => import('#/views/system/online-user/index.vue'),
        meta: {
          authority: ['system:online-user:list'],
          icon: 'lucide:monitor-dot',
          title: '在线用户',
        },
        name: 'SystemOnlineUser',
        path: '/system/online-user',
      },
      {
        component: () => import('#/views/system/audit/index.vue'),
        meta: {
          authority: ['system:audit:login:list', 'system:audit:operation:list'],
          icon: 'lucide:scroll-text',
          title: $t('system.audit.title'),
        },
        name: 'SystemAudit',
        path: '/system/audit',
      },
    ],
  },
];

export default routes;
