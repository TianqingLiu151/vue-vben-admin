# Enterprise Admin

企业级后台管理前端基础架子，基于 Vue 3、Vite、TypeScript、Pinia、Vue Router、Ant Design Vue 和 monorepo workspace 组织。

## 功能范围

- 登录、退出、用户信息与 token 刷新流程
- 后端菜单模式与按钮权限码控制
- 系统管理基础页面：用户、角色、菜单、部门
- 表格 CRUD 模板
- 工作台、分析页、待办页面
- 主题、布局、标签页、国际化、全局偏好设置
- Mock 服务用于本地联调和前端独立开发
- CI、CodeQL、Docker/Nginx 部署基础配置

## 环境要求

- Node.js `^20.19.0 || ^22.18.0 || ^24.0.0`
- pnpm `>=10.0.0`

## 常用命令

```bash
pnpm install
pnpm dev:web
pnpm run typecheck --filter=@vben/web-antd
pnpm run build:web
```

## 目录结构

```text
apps/
  web-antd/       主前端应用
  backend-mock/   本地 mock 服务
internal/         工程化配置、构建配置、lint 配置
packages/         基础组件、布局、请求、权限、状态、工具包
scripts/          项目脚本与 Docker 部署配置
```

## 环境变量

主应用环境变量位于 `apps/web-antd/.env*`：

- `VITE_APP_TITLE`：应用标题
- `VITE_APP_NAMESPACE`：本地缓存命名空间
- `VITE_APP_STORE_SECURE_KEY`：本地持久化加密 key
- `VITE_GLOB_API_URL`：接口基础地址
- `VITE_NITRO_MOCK`：是否启用本地 mock 服务

Mock 服务环境变量位于 `apps/backend-mock/.env`：

- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`

生产环境请使用真实后端地址和独立密钥。

## 权限模型

当前应用默认使用后端菜单模式。登录后前端通过接口获取：

- 用户信息
- 菜单树
- 按钮权限码

路由组件路径需要与 `apps/web-antd/src/views` 下的页面路径对应，例如 `/system/user/list`。

## 部署

本地构建：

```bash
pnpm run build:web
```

Docker 构建：

```bash
bash scripts/deploy/build-local-docker-image.sh
```

构建产物位于 `apps/web-antd/dist`。
