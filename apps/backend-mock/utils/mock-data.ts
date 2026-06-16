export interface UserInfo {
  id: number;
  password: string;
  realName: string;
  roles: string[];
  username: string;
  homePath?: string;
}

export interface TimezoneOption {
  offset: number;
  timezone: string;
}

export const MOCK_USERS: UserInfo[] = [
  {
    id: 0,
    password: 'Admin@123',
    realName: 'Super Admin',
    roles: ['super'],
    username: 'super_admin',
  },
  {
    id: 1,
    password: 'Admin@123',
    realName: 'Admin',
    roles: ['admin'],
    username: 'admin',
    homePath: '/workspace',
  },
  {
    id: 2,
    password: 'User@123',
    realName: 'Operator',
    roles: ['user'],
    username: 'operator',
    homePath: '/analytics',
  },
];

export const MOCK_CODES = [
  // super
  {
    codes: [
      'system:user:list',
      'system:user:create',
      'system:user:update',
      'system:user:delete',
      'system:role:list',
      'system:role:create',
      'system:role:update',
      'system:role:delete',
      'system:menu:list',
      'system:menu:create',
      'system:menu:update',
      'system:menu:delete',
      'system:dept:list',
      'system:dept:create',
      'system:dept:update',
      'system:dept:delete',
      'table:list',
      'table:create',
    ],
    username: 'super_admin',
  },
  {
    // admin
    codes: [
      'system:user:list',
      'system:user:create',
      'system:user:update',
      'system:user:delete',
      'system:role:list',
      'system:role:create',
      'system:role:update',
      'system:role:delete',
      'system:menu:list',
      'system:menu:create',
      'system:menu:update',
      'system:menu:delete',
      'system:dept:list',
      'system:dept:create',
      'system:dept:update',
      'system:dept:delete',
      'table:list',
      'table:create',
    ],
    username: 'admin',
  },
  {
    // user
    codes: ['system:user:list', 'table:list'],
    username: 'operator',
  },
];

const dashboardMenus = [
  {
    meta: {
      order: -1,
      title: 'page.dashboard.title',
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/analytics',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        component: '/dashboard/analytics/index',
        meta: {
          affixTab: true,
          title: 'page.dashboard.analytics',
        },
      },
      {
        name: 'Workspace',
        path: '/workspace',
        component: '/dashboard/workspace/index',
        meta: {
          title: 'page.dashboard.workspace',
        },
      },
    ],
  },
];

const systemMenus = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 10,
      title: 'system.title',
    },
    name: 'System',
    path: '/system',
    children: [
      {
        component: '/system/user/list',
        meta: {
          authority: ['system:user:list'],
          icon: 'lucide:users',
          title: 'system.user.title',
        },
        name: 'SystemUser',
        path: '/system/user',
      },
      {
        component: '/system/role/list',
        meta: {
          authority: ['system:role:list'],
          icon: 'lucide:shield-check',
          title: 'system.role.title',
        },
        name: 'SystemRole',
        path: '/system/role',
      },
      {
        component: '/system/menu/list',
        meta: {
          authority: ['system:menu:list'],
          icon: 'lucide:menu',
          title: 'system.menu.title',
        },
        name: 'SystemMenu',
        path: '/system/menu',
      },
      {
        component: '/system/dept/list',
        meta: {
          authority: ['system:dept:list'],
          icon: 'lucide:building-2',
          title: 'system.dept.title',
        },
        name: 'SystemDept',
        path: '/system/dept',
      },
    ],
  },
];

const tableMenus = [
  {
    meta: {
      icon: 'lucide:table-2',
      order: 20,
      title: 'table.title',
    },
    name: 'Table',
    path: '/table',
    children: [
      {
        component: '/table/basic/index',
        meta: {
          authority: ['table:list'],
          icon: 'lucide:table-properties',
          title: 'table.basic',
        },
        name: 'TableBasic',
        path: '/table/basic',
      },
    ],
  },
];

export const MOCK_MENUS = [
  {
    menus: [...dashboardMenus, ...systemMenus, ...tableMenus],
    username: 'super_admin',
  },
  {
    menus: [...dashboardMenus, ...systemMenus, ...tableMenus],
    username: 'admin',
  },
  {
    menus: [...dashboardMenus, ...tableMenus],
    username: 'operator',
  },
];

export const MOCK_MENU_LIST = [
  {
    id: 1,
    name: 'Workspace',
    status: 1,
    type: 'menu',
    icon: 'mdi:dashboard',
    path: '/workspace',
    component: '/dashboard/workspace/index',
    meta: {
      icon: 'carbon:workspace',
      title: 'page.dashboard.workspace',
      affixTab: true,
      order: 0,
    },
  },
  {
    id: 2,
    meta: {
      icon: 'carbon:settings',
      order: 9997,
      title: 'system.title',
      badge: 'new',
      badgeType: 'normal',
      badgeVariants: 'primary',
    },
    status: 1,
    type: 'catalog',
    name: 'System',
    path: '/system',
    children: [
      {
        id: 200,
        pid: 2,
        path: '/system/user',
        name: 'SystemUser',
        authCode: 'system:user:list',
        status: 1,
        type: 'menu',
        meta: {
          icon: 'carbon:user',
          title: 'system.user.title',
        },
        component: '/system/user/list',
        children: [
          {
            id: 20_001,
            pid: 200,
            name: 'SystemUserCreate',
            status: 1,
            type: 'button',
            authCode: 'system:user:create',
            meta: { title: 'common.create' },
          },
          {
            id: 20_002,
            pid: 200,
            name: 'SystemUserUpdate',
            status: 1,
            type: 'button',
            authCode: 'system:user:update',
            meta: { title: 'common.edit' },
          },
          {
            id: 20_003,
            pid: 200,
            name: 'SystemUserDelete',
            status: 1,
            type: 'button',
            authCode: 'system:user:delete',
            meta: { title: 'common.delete' },
          },
        ],
      },
      {
        id: 203,
        pid: 2,
        path: '/system/role',
        name: 'SystemRole',
        authCode: 'system:role:list',
        status: 1,
        type: 'menu',
        meta: {
          icon: 'carbon:user-role',
          title: 'system.role.title',
        },
        component: '/system/role/list',
        children: [
          {
            id: 20_301,
            pid: 203,
            name: 'SystemRoleCreate',
            status: 1,
            type: 'button',
            authCode: 'system:role:create',
            meta: { title: 'common.create' },
          },
          {
            id: 20_302,
            pid: 203,
            name: 'SystemRoleUpdate',
            status: 1,
            type: 'button',
            authCode: 'system:role:update',
            meta: { title: 'common.edit' },
          },
          {
            id: 20_303,
            pid: 203,
            name: 'SystemRoleDelete',
            status: 1,
            type: 'button',
            authCode: 'system:role:delete',
            meta: { title: 'common.delete' },
          },
        ],
      },
      {
        id: 201,
        pid: 2,
        path: '/system/menu',
        name: 'SystemMenu',
        authCode: 'system:menu:list',
        status: 1,
        type: 'menu',
        meta: {
          icon: 'carbon:menu',
          title: 'system.menu.title',
        },
        component: '/system/menu/list',
        children: [
          {
            id: 20_101,
            pid: 201,
            name: 'SystemMenuCreate',
            status: 1,
            type: 'button',
            authCode: 'system:menu:create',
            meta: { title: 'common.create' },
          },
          {
            id: 20_102,
            pid: 201,
            name: 'SystemMenuUpdate',
            status: 1,
            type: 'button',
            authCode: 'system:menu:update',
            meta: { title: 'common.edit' },
          },
          {
            id: 20_103,
            pid: 201,
            name: 'SystemMenuDelete',
            status: 1,
            type: 'button',
            authCode: 'system:menu:delete',
            meta: { title: 'common.delete' },
          },
        ],
      },
      {
        id: 202,
        pid: 2,
        path: '/system/dept',
        name: 'SystemDept',
        status: 1,
        type: 'menu',
        authCode: 'system:dept:list',
        meta: {
          icon: 'carbon:container-services',
          title: 'system.dept.title',
        },
        component: '/system/dept/list',
        children: [
          {
            id: 20_401,
            pid: 202,
            name: 'SystemDeptCreate',
            status: 1,
            type: 'button',
            authCode: 'system:dept:create',
            meta: { title: 'common.create' },
          },
          {
            id: 20_402,
            pid: 202,
            name: 'SystemDeptUpdate',
            status: 1,
            type: 'button',
            authCode: 'system:dept:update',
            meta: { title: 'common.edit' },
          },
          {
            id: 20_403,
            pid: 202,
            name: 'SystemDeptDelete',
            status: 1,
            type: 'button',
            authCode: 'system:dept:delete',
            meta: { title: 'common.delete' },
          },
        ],
      },
    ],
  },
];

export function getMenuIds(menus: any[]) {
  const ids: number[] = [];
  menus.forEach((item) => {
    ids.push(item.id);
    if (item.children && item.children.length > 0) {
      ids.push(...getMenuIds(item.children));
    }
  });
  return ids;
}

/**
 * 时区选项
 */
export const TIME_ZONE_OPTIONS: TimezoneOption[] = [
  {
    offset: -5,
    timezone: 'America/New_York',
  },
  {
    offset: 0,
    timezone: 'Europe/London',
  },
  {
    offset: 8,
    timezone: 'Asia/Shanghai',
  },
  {
    offset: 9,
    timezone: 'Asia/Tokyo',
  },
  {
    offset: 9,
    timezone: 'Asia/Seoul',
  },
];
