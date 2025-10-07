# 🔐 混合加密聊天系统

基于 **RSA + AES 混合加密算法**的端到端加密实时聊天系统

## 📋 项目简介

这是一个支持一对一实时聊天的 Web 应用，使用混合加密算法实现端到端加密，确保消息安全性。服务器只能看到密文，无法解密用户的聊天内容。

### ✨ 核心特性

- 🔐 **端到端加密**：服务器无法查看消息内容
- 🔑 **混合加密**：RSA-2048 保护密钥交换，AES-256 保证加密效率
- ⚡ **实时通信**：WebSocket 实现低延迟消息推送
- 🔒 **密钥隔离**：每对用户使用独立的 AES 密钥
- 🌐 **Web Crypto API**：使用浏览器原生加密功能，安全可靠

## 🛠️ 技术栈

### 前端
- **框架**：React 18
- **加密**：Web Crypto API (浏览器原生)
- **实时通信**：WebSocket
- **HTTP 客户端**：Axios
- **样式**：CSS3

### 后端
- **运行环境**：Node.js
- **框架**：Express.js
- **数据库**：SQLite3
- **实时通信**：ws (WebSocket)
- **密码加密**：bcrypt
- **其他**：cors, uuid

## 🔐 混合加密方案

### 加密算法组合
**RSA-OAEP (2048位) + AES-GCM (256位)**

### 加密流程

#### 1️⃣ 用户注册阶段
```
用户注册
  ↓
前端生成 RSA 密钥对（2048位）
  ↓
公钥 → 上传服务器存储
私钥 → 保存在浏览器 localStorage
```

#### 2️⃣ 密钥交换阶段
```
用户A想与用户B聊天
  ↓
A 从服务器获取 B 的 RSA 公钥
  ↓
A 生成随机 AES-256 密钥
  ↓
A 用 B 的公钥加密 AES 密钥
  ↓
加密后的AES密钥 → 存储在 A 的 localStorage
```

#### 3️⃣ 消息加密传输
```
发送消息流程：
明文消息 → AES加密 → 密文+IV → WebSocket → 服务器 → 目标用户

接收消息流程：
密文+IV → AES解密（用本地AES密钥）→ 明文显示
```

## 📦 项目结构

```
secure-chat-system/
├── client/                 # React 前端
│   ├── src/
│   │   ├── components/    # React 组件
│   │   │   ├── Login.jsx         # 登录/注册组件
│   │   │   ├── UserList.jsx      # 用户列表组件
│   │   │   └── ChatWindow.jsx    # 聊天窗口组件
│   │   ├── utils/
│   │   │   └── crypto.js         # 加密工具函数
│   │   ├── styles/        # CSS 样式文件
│   │   ├── App.js         # 主应用组件
│   │   └── index.js
│   └── package.json
│
├── server/                # Node.js 后端
│   ├── routes/           # API 路由
│   │   ├── auth.js              # 认证 API
│   │   └── messages.js          # 消息 API
│   ├── server.js         # 主服务器入口
│   ├── db.js            # 数据库配置
│   ├── database.db      # SQLite 数据库
│   └── package.json
│
└── README.md
```

## 🚀 安装与运行

### 环境要求
- Node.js 14+
- npm 或 yarn
- 现代浏览器（Chrome 37+, Firefox 34+）

### 1. 克隆项目
```bash
git clone <repository-url>
cd secure-chat-system
```

### 2. 安装后端依赖
```bash
cd server
npm install
```

### 3. 启动后端服务器
```bash
npm start
```
服务器将运行在 `http://localhost:3001`

### 4. 安装前端依赖
```bash
cd ../client
npm install
```

### 5. 启动前端应用
```bash
npm start
```
应用将自动打开浏览器访问 `http://localhost:3000`

## 📖 使用说明

### 1. 注册账号
- 打开应用，点击"注册"
- 输入用户名（3-20个字符）和密码（至少6个字符）
- 系统自动生成 RSA 密钥对，公钥上传服务器

### 2. 登录系统
- 输入用户名和密码登录
- 成功后进入用户列表页面

### 3. 开始聊天
- 在用户列表中选择要聊天的对象
- 系统自动建立加密通道（生成并交换 AES 密钥）
- 输入消息并发送，所有消息端到端加密

### 4. 历史消息
- 刷新页面后，历史消息自动加载并解密显示

## 🔒 安全特性

### ✅ 已实现
- **端到端加密**：服务器只能看到密文
- **密钥隔离**：每对用户使用独立的 AES 密钥
- **私钥安全**：RSA 私钥永不离开用户浏览器
- **历史消息加密**：数据库存储密文

### ⚠️ 注意事项
1. **私钥存储**：当前使用 localStorage 存储私钥，生产环境应使用 IndexedDB + 密码派生密钥
2. **会话管理**：当前使用简单 token，生产环境应使用 JWT + HTTPS
3. **密钥备份**：当前方案清除浏览器数据会丢失私钥，生产环境需密钥恢复机制
4. **HTTPS**：生产环境必须使用 HTTPS 传输

## 🧪 测试场景

### 场景1：完整加密流程
1. 用户 A 注册（生成密钥对）
2. 用户 B 注册（生成密钥对）
3. A 给 B 发送消息 "Hello"
4. B 收到并正确解密
5. B 回复 "Hi"
6. A 收到并正确解密

### 场景2：多用户隔离
1. 创建用户 A、B、C
2. A 分别与 B、C 聊天
3. 确认密钥隔离（A-B 的消息 C 无法解密）

### 场景3：安全性验证
1. 查看数据库 messages 表（应为密文）
2. 查看 Network 传输内容（应为密文）
3. 验证服务器无法解密消息

## 📊 数据库设计

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | TEXT | 用户名（唯一） |
| password_hash | TEXT | 密码哈希（bcrypt） |
| public_key | TEXT | RSA 公钥（PEM 格式） |
| created_at | DATETIME | 创建时间 |

### messages 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| from_user_id | INTEGER | 发送者 ID |
| to_user_id | INTEGER | 接收者 ID |
| encrypted_content | TEXT | 加密后的消息内容 |
| iv | TEXT | AES 加密初始化向量 |
| created_at | DATETIME | 发送时间 |

## 🎯 API 接口

### 认证相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/users` - 获取用户列表
- `GET /api/users/:id/publickey` - 获取用户公钥

### 消息相关
- `POST /api/messages` - 保存消息
- `GET /api/messages/:userId` - 获取历史消息

### WebSocket
- 连接：`ws://localhost:3001`
- 认证：`{ type: 'auth', userId: <id> }`
- 消息：`{ type: 'message', from: <id>, to: <id>, content: <encrypted> }`

## 📝 开发进度

- [x] **阶段 0**：项目初始化
- [ ] **阶段 1**：用户认证系统（无加密）
- [ ] **阶段 2**：实时通信（无加密）
- [ ] **阶段 3**：混合加密核心功能 ⭐
- [ ] **阶段 4**：完善与测试
- [ ] **阶段 5**：文档编写

当前完成：**阶段 0 - 项目初始化** ✅

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**⚠️ 免责声明**：本项目仅供学习和演示使用，不建议直接用于生产环境。如需商用，请进行安全审计和加固。

