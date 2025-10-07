# 项目结构说明

## 📁 目录结构

```
secure-chat-system/
├── client/                    # 前端应用
│   ├── public/               # 静态资源
│   ├── src/                  # 源代码
│   │   ├── components/       # React 组件
│   │   ├── utils/           # 工具函数（加密、存储等）
│   │   └── App.js           # 主应用组件
│   ├── package.json         # 前端依赖
│   └── README.md           # 前端文档
│
├── server/                   # 后端服务器
│   ├── server.js            # WebSocket 服务器
│   ├── database.db          # SQLite 数据库（自动生成）
│   ├── package.json         # 后端依赖
│   └── README.md           # 后端文档
│
├── scripts/                 # 工具脚本
│   ├── start-system.sh      # 系统启动脚本
│   ├── stop-system.sh       # 系统停止脚本
│   ├── test-chat-system.js  # 自动化测试脚本
│   └── verify-encryption.js # 加密验证脚本
│
├── docs/                    # 项目文档
│   ├── README.md            # 项目主文档
│   ├── USAGE_GUIDE.md       # 使用指南
│   ├── PROJECT_PLAN.md      # 项目计划
│   └── fixes/               # 修复记录
│       ├── 修复文件清单.md
│       ├── 密钥初始化问题修复说明.md
│       ├── 测试修复.md
│       └── 问题修复总结.md
│
├── .gitignore               # Git 忽略文件
├── .server.pid             # 服务器进程ID（运行时生成）
├── .client.pid             # 客户端进程ID（运行时生成）
├── package.json            # 根项目依赖
└── PROJECT_STRUCTURE.md    # 本文件
```

## 🚀 快速启动

### 方式一：使用启动脚本（推荐）

```bash
# 从项目根目录执行
./scripts/start-system.sh

# 停止系统
./scripts/stop-system.sh
```

### 方式二：手动启动

```bash
# 1. 安装依赖
cd server && npm install
cd ../client && npm install

# 2. 启动后端（终端1）
cd server && node server.js

# 3. 启动前端（终端2）
cd client && npm start
```

## 🧪 测试

```bash
# 运行自动化测试
node scripts/test-chat-system.js

# 验证加密功能
node scripts/verify-encryption.js
```

## 📚 文档说明

- **README.md** - 项目概览和主要文档
- **USAGE_GUIDE.md** - 详细使用指南，包括所有功能说明
- **PROJECT_PLAN.md** - 项目开发计划和架构设计
- **fixes/** - 问题修复记录和解决方案

## 🔧 核心功能

### 客户端 (client/)
- 端到端加密聊天界面
- 用户注册和认证
- 在线用户列表
- 私聊和加密消息
- 本地密钥存储管理

### 服务器 (server/)
- WebSocket 实时通信
- 用户管理和认证
- 公钥交换服务
- SQLite 数据库存储

### 工具脚本 (scripts/)
- 一键启动/停止系统
- 自动化功能测试
- 加密功能验证

## 🔒 安全特性

1. **端到端加密** - 使用 ECDH + AES-256-GCM
2. **密钥协商** - Diffie-Hellman 密钥交换
3. **本地密钥存储** - 私钥仅存储在客户端
4. **身份验证** - JWT token 认证

## 📝 注意事项

1. **PID 文件** - `.server.pid` 和 `.client.pid` 在系统运行时自动生成，已添加到 `.gitignore`
2. **数据库文件** - `server/database.db` 在首次运行时自动创建
3. **端口占用** - 默认使用 3000（前端）和 3001（后端）端口
4. **浏览器支持** - 需要支持 Web Crypto API 的现代浏览器

## 🔄 项目更新历史

### v1.0 - 初始版本
- 基础聊天功能
- 端到端加密
- 用户认证

### v1.1 - 架构优化
- 重新组织项目结构
- 分离文档和脚本
- 完善 Git 版本控制

## 🐛 问题排查

如遇到问题，请查看：
1. `docs/fixes/` 目录下的修复记录
2. 各子项目的 README.md
3. 使用 `scripts/test-chat-system.js` 进行系统测试

## 📞 技术支持

如有问题，请查阅文档或提交 Issue。

