# HIS 医生工作站 - 后端

医生工作站 + 电子病历 EMR + 基础数据的临床文书系统后端服务。

## 技术栈

| 组件 | 选型 |
|---|---|
| 框架 | NestJS 10（TypeScript） |
| ORM | Mongoose 8（@nestjs/mongoose） |
| 数据库 | MongoDB 4.4（单节点副本集 `rs0`，127.0.0.1:27017） |
| 认证 | JWT（@nestjs/jwt）+ bcryptjs |
| 校验 | class-validator + class-transformer（全局 ValidationPipe） |
| 接口文档 | Swagger（@nestjs/swagger） |
| 配置 | @nestjs/config（.env） |

## 目录结构

```
src/
├── main.ts                     # 入口：全局前缀 /api、ValidationPipe、Swagger、统一响应/异常
├── app.module.ts               # 根模块：ConfigModule、MongooseModule、各业务模块装配
├── app.controller.ts           # 健康检查 /api/health（公开）
└── common/                     # 全局基建
    ├── decorators/             # @Public() @Roles() @CurrentUser()
    ├── filters/                # 统一异常响应 HttpExceptionFilter
    ├── guards/                 # JwtAuthGuard（登录校验）、RolesGuard（角色校验）
    └── interceptors/           # TransformInterceptor（统一响应）、AuditLogInterceptor（全站审计）
└── modules/                    # 业务模块（11 个）
    ├── auth/                   # 登录认证（JWT 签发）
    ├── users/                  # 用户管理（种子管理员 admin/admin123）
    ├── patients/               # 患者主索引 EMPI（建档/搜索/合并）
    ├── audit-log/              # 操作审计日志（全站留痕，敏感字段脱敏）
    ├── dictionaries/           # 基础字典管理（占位）
    ├── rbac/                   # 角色权限管理（占位）
    ├── outpatient/             # 门急诊医生工作站（占位）
    ├── inpatient/              # 住院医生工作站（占位）
    ├── emr/                    # 电子病历 EMR（占位）
    ├── consultation/           # 会诊管理（占位）
    └── ca/                     # 电子签名 CA（占位）
```

## 快速开始

### 前置条件

- Node.js 18+
- MongoDB 4.4+ 以副本集模式运行于 `127.0.0.1:27017`（副本集名 `rs0`）
- 首次启动前复制环境变量文件：`cp .env.example .env` 并按需修改

### 安装与运行

```bash
npm install
npm run start:dev    # 开发模式（热重载）
# 或
npm run build && npm run start:prod
```

启动成功后：

- 服务地址：`http://127.0.0.1:3000/api`
- Swagger 文档：`http://127.0.0.1:3000/api/docs`

## 环境变量（.env）

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3000` | 服务端口 |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/his?replicaSet=rs0` | MongoDB 连接串 |
| `JWT_SECRET` | - | JWT 签名密钥（生产环境必须更换） |
| `JWT_EXPIRES_IN` | `8h` | Token 有效期 |

## API 约定

- 统一前缀：`/api`
- 统一响应结构：`{ code, data, message }`，`code = 0` 表示成功，异常时为 HTTP 状态码
- 除标注 `@Public()` 的接口（如登录、健康检查）外，均需请求头 `Authorization: Bearer <token>`
- 角色控制：接口可用 `@Roles('admin', 'doctor', ...)` 声明所需角色
- 全站操作自动审计：登录、增删改查均写入 `auditlogs` 集合，请求体中的 `password`、`token`、`idCardNo` 等敏感字段自动脱敏

## 初始账号

首次启动自动创建种子管理员：`admin` / `admin123`（登录后请尽快修改）。

角色约定：`admin` 管理员 / `doctor` 医生 / `nurse` 护士 / `pharmacist` 药师 / `manager` 管理者。

## 脚本命令

| 命令 | 说明 |
|---|---|
| `npm run start:dev` | 开发模式（热重载） |
| `npm run build` | 编译到 dist/ |
| `npm run start:prod` | 生产模式运行 |
| `npm test` | 单元测试（jest） |
| `npm run test:e2e` | e2e 测试 |
| `npm run lint` | ESLint 检查并修复 |

## 提交规范

采用 Conventional Commits：`feat:` 新功能 / `fix:` 修复 / `docs:` 文档 / `chore:` 工程配置 / `test:` 测试 / `refactor:` 重构。
