# PG Client

PG Client 是一个本地运行的 PostgreSQL 查询和数据浏览工具。前端使用 Vue 3、TypeScript、Element Plus 和 Monaco Editor，后端使用 Express 与 `pg` 负责连接真实的 PostgreSQL 服务。

连接配置不再依赖额外的本地配置数据库，直接保存在当前浏览器的 `localStorage` 中。

## 功能特性

- 连接管理：新建、编辑、删除、测试 PostgreSQL 连接。
- 本地保存：连接信息保存在浏览器 `localStorage`，不需要单独准备配置库。
- 数据库浏览：连接后列出服务器下的数据库。
- Schema 切换：默认使用 `public`，也可以通过小下拉切换其他 schema。
- 表数据查看：点击表后以标签页方式打开，支持分页、排序和列搜索。
- SQL 编辑器：内置 Monaco Editor，支持 PostgreSQL 语法高亮和 `Ctrl+Enter` 执行。
- 查询结果：展示列、行数、耗时、命令类型和结果表格。

## 技术栈

- 前端：Vue 3、TypeScript、Vue Router、Element Plus、Monaco Editor
- 后端：Express、pg
- 构建工具：Vite

## 快速开始

安装依赖：

```bash
npm install
```

启动前端和后端：

```bash
npm run dev
```

默认地址：

- 前端：`http://localhost:5173`
- API：`http://127.0.0.1:3001`

如果 `5173` 已被占用，Vite 会自动切换到其他端口。后端默认监听 `3001`，如果该端口已被占用，需要先停止旧服务。

## 使用说明

1. 打开首页，点击“新建连接”。
2. 填写连接名称、主机、端口、数据库、用户名和密码。
3. 可先点击“测试连接”确认配置是否可用。
4. 保存后，连接信息会写入当前浏览器的 `localStorage`。
5. 点击连接卡片进入数据库浏览和 SQL 编辑界面。

注意：密码也会保存在浏览器 `localStorage` 中。不要在共享电脑或不可信环境中保存敏感连接信息。

## 常用命令

```bash
npm run dev
```

启动 Vite 前端和 Express API。

```bash
npm run dev:client
```

只启动前端。

```bash
npm run dev:server
```

只启动 API 服务。

```bash
npm exec vue-tsc -- --noEmit
```

检查前端 Vue/TypeScript 类型。

```bash
npx tsc --noEmit --pretty false
```

检查 TypeScript 项目类型。

```bash
npm exec vite -- build
```

构建前端生产包。

## API 简介

连接配置由前端通过请求头传给后端，后端不持久化连接信息。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/connections/test` | 测试连接配置 |
| GET | `/api/databases?connectionId=` | 获取数据库列表 |
| GET | `/api/schemas?connectionId=&database=` | 获取 schema 列表 |
| GET | `/api/tables?connectionId=&database=&schema=` | 获取表列表 |
| GET | `/api/columns?connectionId=&database=&schema=&table=` | 获取表字段 |
| POST | `/api/query` | 执行 SQL |

`/api/connections` 相关的保存、编辑和删除接口不再负责持久化，连接 CRUD 在前端 `localStorage` 内完成。

## 项目结构

```text
server/
  index.ts              # Express 服务入口
  poolManager.ts        # PostgreSQL 连接池管理
  routes/
    connections.ts      # 连接测试接口
    query.ts            # 数据库、schema、表和 SQL 查询接口

src/
  main.ts               # 前端应用入口
  router.ts             # 路由配置
  types/index.ts        # 类型定义
  composables/
    useConnections.ts   # localStorage 连接管理
    useDatabase.ts      # 数据库、schema、表和数据查询
    useQuery.ts         # SQL 执行状态
  components/
    connections/
      ConnectionManager.vue
    layout/
      AppHeader.vue
      AppSidebar.vue
      AppLayout.vue
    browser/
      SchemaTree.vue
      TableData.vue
      TableSchema.vue
    editor/
      SqlEditor.vue
      EditorToolbar.vue
    results/
      ResultTable.vue
      ResultStatus.vue
  views/
    Home.vue
    ServerLayout.vue
    DatabaseLayout.vue
    Query.vue
    TableView.vue
```

## 安全说明

- 不要提交 `.env`、本地密码或其他敏感文件。
- `node_modules/` 和 `dist/` 不应提交到仓库。
- 浏览器 `localStorage` 适合本地开发和个人使用；生产环境应改为更安全的密钥管理方案。
