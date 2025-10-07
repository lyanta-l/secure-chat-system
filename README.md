# 🔒 安全聊天系统 (Secure Chat System)

> 一个基于端到端加密的实时聊天应用，使用混合加密系统（RSA + AES）保护用户隐私

[![测试状态](https://img.shields.io/badge/tests-9%2F9%20passing-brightgreen)](#测试)
[![加密](https://img.shields.io/badge/encryption-RSA%202048%20%2B%20AES%20256-blue)](#安全特性)
[![Node](https://img.shields.io/badge/node-v22+-green)](#)
[![React](https://img.shields.io/badge/react-18.2.0-blue)](#)

---

## 📖 项目简介

这是一个完整的端到端加密聊天系统，具有以下特点：

- 🔐 **端到端加密**: 使用RSA-2048和AES-256混合加密
- ⚡ **实时通信**: WebSocket实现即时消息传递
- 🎨 **现代UI**: React前端，美观易用
- 🔒 **隐私保护**: 服务器无法解密消息内容
- 🧪 **完整测试**: 9个自动化测试，100%通过率

---

## 🚀 快速启动

### 方式一：一键启动（推荐）

```bash
# 启动系统（自动安装依赖、检查端口、启动服务）
./start.sh

# 停止系统
./stop.sh
```

### 方式二：手动启动

```bash
# 1. 安装依赖
cd server && npm install
cd ../client && npm install

# 2. 启动后端（终端1）
cd server && node server.js

# 3. 启动前端（终端2）
cd client && PORT=3000 npm start
```

### 访问应用

打开浏览器访问：http://localhost:3000

---

## 📁 项目结构

```
secure-chat-system/
├── client/                  # 前端应用（React）
├── server/                  # 后端服务器（WebSocket）
├── scripts/                 # 工具脚本
│   ├── start-system.sh     # 系统启动脚本
│   ├── stop-system.sh      # 系统停止脚本
│   └── test-chat-system.js # 自动化测试
├── docs/                    # 项目文档
│   ├── README.md           # 详细文档
│   ├── USAGE_GUIDE.md      # 使用指南
│   └── PROJECT_PLAN.md     # 项目计划
├── start.sh                 # 启动入口
├── stop.sh                  # 停止入口
└── PROJECT_STRUCTURE.md     # 结构说明
```

详细结构请查看 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

## 🧪 测试

### 运行自动化测试

```bash
node scripts/test-chat-system.js
```

### 测试覆盖

- ✅ 基本连接测试
- ✅ 多用户连接测试
- ✅ 密钥交换测试
- ✅ 端到端加密消息传输测试
- ✅ 多轮对话测试
- ✅ 三人对话测试
- ✅ 用户离线检测测试
- ✅ 特殊字符和表情符号测试
- ✅ 断线重连测试

**通过率: 100%** 🎉

---

## 🔒 安全特性

### 加密技术栈

1. **非对称加密**: RSA-2048（密钥交换）
2. **对称加密**: AES-256-GCM（消息加密）
3. **密钥协商**: Diffie-Hellman ECDH
4. **完整性验证**: GCM认证标签

### 安全流程

```
用户A                服务器              用户B
  |                    |                   |
  |-- 注册 ----------->|                   |
  |<-- 公钥分享 --------|                   |
  |                    |<---- 注册 ---------|
  |                    |---- 公钥分享 ----->|
  |                    |                   |
  |-- 请求B的公钥 ----->|                   |
  |<-- B的公钥 ---------|                   |
  |                    |                   |
  |-- 加密消息 -------->|-- 转发 ---------->|
  |  (用B的公钥加密)    |  (服务器无法解密) | (用A的私钥解密)
```

### 隐私保护

- 私钥仅存储在客户端（localStorage）
- 服务器只转发加密消息，无法解密
- 支持清除本地密钥

---

## 📚 文档

- [详细使用指南](./docs/USAGE_GUIDE.md) - 完整功能和使用说明
- [项目开发计划](./docs/PROJECT_PLAN.md) - 架构设计和实现细节
- [项目结构说明](./PROJECT_STRUCTURE.md) - 目录组织和文件说明

---

## 🛠️ 技术栈

### 前端
- React 18.2.0
- Web Crypto API
- WebSocket Client
- Modern CSS

### 后端
- Node.js
- WebSocket (ws)
- SQLite3
- Crypto (Node.js)

### 工具
- Bash脚本
- 自动化测试框架

---

## 🐛 常见问题

### 1. 启动失败？

```bash
# 检查端口占用
lsof -i :3000
lsof -i :3001

# 使用停止脚本清理
./stop.sh
```

### 2. 看到"获取用户列表失败"？

- 检查后端服务器是否运行
- 清除浏览器 LocalStorage
- 刷新页面重新注册

### 3. 消息无法解密？

- 确保双方都已注册并获取对方公钥
- 检查浏览器是否支持 Web Crypto API
- 尝试清除密钥并重新注册

详细问题排查请查看 [docs/fixes/](./docs/fixes/) 目录

---

## 📝 开发路线图

- [x] 基础聊天功能
- [x] 端到端加密
- [x] 用户认证
- [x] 自动化测试
- [x] 项目结构优化
- [ ] 群组聊天
- [ ] 文件传输
- [ ] 消息历史
- [ ] 移动端适配

---

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 🎯 快速链接

- [开始使用](#快速启动)
- [查看测试](#测试)
- [了解安全](#安全特性)
- [阅读文档](#文档)
- [问题排查](#常见问题)

---

**享受安全的加密聊天体验！** 🚀🔐
