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
└── modules/                    # 业务模块（14 个）
    ├── auth/                   # 登录认证（JWT 签发）
    ├── users/                  # 用户管理（种子账号见下）
    ├── patients/               # 患者主索引 EMPI（建档/搜索/合并）
    ├── outpatient/             # 门急诊就诊：医师直接接诊（无挂号）、今日就诊
    ├── emr/                    # 电子病历：病历/处方列表、保存、CA 签名（签名联动生成处方笺）
    ├── consultation/           # 会诊管理：发起/响应/催办
    ├── drug-manual/            # 药品说明书库（drugmanuals 集合：药理分类筛选、未知药品记录、注册入库自动词根分类）
    ├── regions/                # 行政区划（regions 集合：省市区三级树，建档住址级联选择）
    ├── inpatient/              # 住院工作站：床位一览、长期/临时医嘱、停嘱
    ├── dictionaries/           # 基础字典：ICD-10/科室/药品目录
    ├── dashboard/              # 工作台聚合：统计摘要、待办聚合
    ├── search/                 # Cmd+K 聚合搜索：患者/病历/药品/命令
    ├── audit-log/              # 操作审计日志（全站留痕，敏感字段脱敏）
    ├── seed/                   # 演示数据种子（患者/就诊/病历/会诊/床位/医嘱/字典）
    ├── rbac/                   # 角色权限管理（占位）
    └── ca/                     # 电子签名 CA（占位，签名暂由 emr 模块模拟实现）
```

## 快速开始

### 前置条件

- Node.js 18+
- MongoDB 4.4+ 以副本集模式运行于 `127.0.0.1:27017`（副本集名 `rs0`）
- 首次启动前复制环境变量文件：`cp .env.example .env` 并按需修改

### 安装与运行

```bash
yarn install
yarn start:dev    # 开发模式（热重载）
# 或
yarn build && node dist/main.js
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

首次启动自动创建种子账号（密码除注明外统一 `123456`）：

| 工号 | 姓名 | 角色 | 密码 |
|---|---|---|---|
| `D1027` | 王医生 | doctor 医生 | `123456` |
| `N1001` | 李护士 | nurse 护士 | `123456` |
| `P2001` | 张药师 | pharmacist 药师 | `123456` |
| `admin` | 系统管理员 | admin 管理员 | `admin123` |

角色约定：`admin` 管理员 / `doctor` 医生 / `nurse` 护士 / `pharmacist` 药师 / `manager` 管理者。

首次启动还会注入 UI 稿对应的演示数据（8 患者 / 18 今日就诊 / 7 病历 / 3 会诊 / 8 床位 / 4 医嘱 / 20 字典），删除 `his` 库中业务集合后重启可重新生成。

## 主要接口

| 接口 | 说明 |
|---|---|
| `POST /api/auth/login` | 登录（公开），返回 JWT |
| `GET /api/dashboard/summary` | 工作台统计（今日接诊/复诊/待签名/待会诊） |
| `GET /api/dashboard/todos` | 待办聚合（待签名文书/待响应会诊/报告回传） |
| `POST /api/outpatient/visits` | 医师直接接诊（新建首诊/复诊调档） |
| `GET /api/emr/records` | 病历列表（keyword/signed/type 过滤） |
| `POST /api/emr/records/:id/sign` | CA 签名（模拟） |
| `GET/POST /api/consultations` | 会诊列表/发起 |
| `POST /api/consultations/:id/respond` | 响应会诊 |
| `GET /api/inpatient/beds` `GET /api/inpatient/orders` | 床位/医嘱 |
| `GET /api/dictionaries/:category` | ICD-10/科室/药品字典 |
| `GET /api/drug-manuals` | 药品说明书列表（keyword 搜索，含厂家/说明书全文） |
| `POST /api/drug-manuals/upsert` | 爬虫导入说明书（按药名 upsert） |
| `GET /api/search?q=` | Cmd+K 聚合搜索 |
| `GET /api/audit-logs` | 审计日志（仅 admin） |

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
