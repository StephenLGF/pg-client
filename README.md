# PG Client

PG Client 是一个本地运行的 PostgreSQL 查询和数据浏览工具。前端使用 Vue 3、TypeScript、Element Plus 和 Monaco Editor，后端使用 Express 与 `pg` 负责连接真实的 PostgreSQL 服务。

连接配置不再依赖额外的本地配置数据库，直接保存在后端 `data/connections.json` 中。

## 功能特性

- 连接管理：新建、编辑、删除、测试 PostgreSQL 连接。
- 本地保存：连接信息保存在后端 `data/connections.json`，不需要单独准备配置库。
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

### 一键启动（推荐）

首次运行：

```bash
npm run setup
```

这会安装依赖、构建前端、后台启动服务。然后访问 `http://localhost:3001` 即可。

### 开发模式

```bash
npm run dev
```

前端 `http://localhost:5173`，后端 API `http://127.0.0.1:3001`。

### 生产部署

更新代码后重新部署：

```bash
npm run deploy
```

这会重新构建前端并后台启动服务。访问 `http://localhost:3001`。

## 使用说明

1. 打开首页，点击”新建连接”。
2. 填写连接名称、主机、端口、数据库、用户名和密码。
3. 可先点击”测试连接”确认配置是否可用。
4. 保存后，连接信息会写入后端 `data/connections.json`。
5. 点击连接卡片进入数据库浏览和 SQL 编辑界面。

注意：密码也会保存在后端 `data/connections.json` 中。不要在共享服务器或不可信环境中保存敏感连接信息。

### 只读限制

SQL 执行接口已启用只读拦截，仅允许 `SELECT`、`WITH`、`EXPLAIN`、`SHOW`、`DESCRIBE`、`TABLE` 等查询语句。所有数据修改操作（`INSERT`、`UPDATE`、`DELETE`、`DROP`、`CREATE`、`ALTER`、`TRUNCATE` 等）均会被拒绝并返回 403。

## 常用命令

```bash
npm run setup
```

一键安装依赖、构建、后台启动。

```bash
npm run deploy
```

构建并后台启动服务。

```bash
npm start
```

前台启动服务（需先构建）。

```bash
npm run start:bg
```

后台启动服务（需先构建），日志写入 `app.log`。

```bash
npm run dev
```

开发模式：Vite 前端 + Express API（热更新）。

```bash
npm run dev:client
```

只启动前端。

```bash
npm run dev:server
```

只启动 API 服务。

```bash
npm run build
```

构建前端生产包到 `dist/`。

```bash
npm exec vue-tsc -- --noEmit
```

检查前端 Vue/TypeScript 类型。

```bash
npx tsc --noEmit --pretty false
```

检查 TypeScript 项目类型。

## API 简介

连接配置由前端通过请求头传给后端，后端不持久化连接信息。

生产环境 Express 同时托管前端静态文件和 API，访问 `http://localhost:3001` 即可。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/connections` | 获取所有连接配置 |
| POST | `/api/connections` | 创建连接配置 |
| PUT | `/api/connections/:id` | 更新连接配置 |
| DELETE | `/api/connections/:id` | 删除连接配置 |
| POST | `/api/connections/test` | 测试表单中的连接配置 |
| POST | `/api/connections/:id/test` | 测试已保存的连接 |
| GET | `/api/databases?connectionId=` | 获取数据库列表 |
| GET | `/api/schemas?connectionId=&database=` | 获取 schema 列表 |
| GET | `/api/tables?connectionId=&database=&schema=` | 获取表列表 |
| GET | `/api/columns?connectionId=&database=&schema=&table=` | 获取表字段 |
| POST | `/api/query` | 执行 SQL（只读查询，修改操作会被拦截） |

连接配置的 CRUD 由后端 `dataStore.ts` 负责，持久化在 `data/connections.json` 中。

## 项目结构

```text
server/
  index.ts              # Express 服务入口（同时托管前端静态文件）
  poolManager.ts        # PostgreSQL 连接池管理
  routes/
    connections.ts      # 连接测试接口
    query.ts            # 数据库、schema、表和 SQL 查询接口（含只读拦截）

src/
  main.ts               # 前端应用入口
  router.ts             # 路由配置
  types/index.ts        # 类型定义
  composables/
    useConnections.ts   # 连接管理（API 调用后端）
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
- `node_modules/`、`dist/` 和 `data/` 不应提交到仓库（已配置 `.gitignore`）。
- `data/connections.json` 以明文存储密码，仅适合本地开发和个人使用。
