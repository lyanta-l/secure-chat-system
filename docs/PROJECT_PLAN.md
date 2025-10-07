# 混合加密算法的聊天管理系统 - 项目规划文档

## 📋 项目概述

**项目名称**：基于混合加密算法的端到端加密聊天系统

**项目目标**：开发一个支持一对一实时聊天的Web应用，使用RSA+AES混合加密算法实现端到端加密，确保消息安全性。

**部署方式**：本地演示

---

## 🛠️ 技术栈

### 前端
- **框架**：React 18+
- **加密**：Web Crypto API（浏览器原生）
- **实时通信**：WebSocket（或Socket.IO客户端）
- **HTTP客户端**：Axios
- **样式**：CSS3 / Tailwind CSS（可选）

### 后端
- **运行环境**：Node.js
- **框架**：Express.js
- **数据库**：SQLite3
- **实时通信**：ws（WebSocket库）或Socket.IO
- **密码加密**：bcrypt
- **其他**：cors, uuid

### 开发环境
- **操作系统**：Xubuntu (Linux)
- **包管理**：npm

---

## 🔐 混合加密方案

### 加密算法组合
**RSA（非对称加密）+ AES-256（对称加密）**

### 加密流程

#### 1. 用户注册阶段
```
用户注册
  ↓
前端生成 RSA 密钥对（2048位）
  ↓
公钥 → 上传服务器存储
私钥 → 保存在浏览器 localStorage
```

#### 2. 密钥交换阶段
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

#### 3. 消息加密传输
```
发送消息流程：
明文消息 → AES加密 → 密文+IV → WebSocket → 服务器 → 目标用户

接收消息流程：
密文+IV → AES解密（用本地AES密钥）→ 明文显示
```

#### 4. 安全特性
- ✅ **端到端加密**：服务器只能看到密文
- ✅ **密钥隔离**：每对用户独立AES密钥
- ✅ **私钥安全**：RSA私钥永不离开用户浏览器
- ✅ **历史消息加密**：数据库存储密文

---

## 📦 核心功能需求

### 1. 身份认证系统
- [x] 用户注册（用户名+密码+RSA公钥）
- [x] 用户登录（密码bcrypt验证）
- [x] 会话管理（简单token机制）

### 2. 实时通信
- [x] WebSocket长连接
- [x] 一对一消息实时推送
- [x] 在线状态管理

### 3. 消息管理
- [x] 发送加密消息
- [x] 接收并解密消息
- [x] 获取历史消息（按时间顺序）

### 4. 加密功能
- [x] RSA密钥对生成
- [x] AES密钥生成与交换
- [x] 消息加密/解密
- [x] 密文存储

### 5. 用户界面
- [x] 登录/注册页面
- [x] 用户列表（可聊天对象）
- [x] 聊天窗口（消息展示+输入）
- [x] 基础样式

---

## ✅ 详细 TodoList

### **阶段 0：项目初始化**

#### 项目结构
- [ ] 创建项目文件夹结构
  ```
  secure-chat-system/
  ├── client/          # React前端
  ├── server/          # Node.js后端
  ├── docs/            # 文档
  └── README.md
  ```

#### 后端初始化
- [ ] 初始化Node.js项目
  ```bash
  cd server && npm init -y
  ```
- [ ] 安装后端依赖
  ```bash
  npm install express sqlite3 ws cors bcrypt uuid
  ```
- [ ] 创建基础文件结构
  ```
  server/
  ├── server.js         # 主入口
  ├── db.js             # 数据库配置
  ├── routes/           # API路由
  │   ├── auth.js
  │   └── messages.js
  └── database.db       # SQLite数据库文件
  ```

#### 前端初始化
- [ ] 创建React应用
  ```bash
  npx create-react-app client
  ```
- [ ] 安装前端依赖
  ```bash
  cd client && npm install axios
  ```
- [ ] 创建基础组件结构
  ```
  client/src/
  ├── components/
  │   ├── Login.jsx
  │   ├── UserList.jsx
  │   └── ChatWindow.jsx
  ├── utils/
  │   └── crypto.js     # 加密工具函数
  └── App.js
  ```

---

### **阶段 1：用户认证系统（无加密）** 🔑 ✅ **已完成**

#### 后端任务
- [x] 创建SQLite数据库结构
  ```sql
  -- users表
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    public_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- messages表
  CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    encrypted_content TEXT NOT NULL,
    iv TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
  );
  ```

- [x] 实现注册API：`POST /api/register`
  - 接收：`{ username, password }`
  - 验证用户名不重复
  - 使用bcrypt哈希密码
  - 返回：`{ success, userId }`

- [x] 实现登录API：`POST /api/login`
  - 接收：`{ username, password }`
  - 验证密码
  - 生成session token（使用uuid）
  - 返回：`{ success, token, userId, username }`

- [x] 实现获取用户列表API：`GET /api/users`
  - 返回除当前用户外的所有用户
  - 格式：`[{ id, username }]`

#### 前端任务
- [x] 创建登录/注册页面组件（`Login.jsx`）
  - 用户名输入框
  - 密码输入框
  - 登录/注册切换Tab
  - 表单提交逻辑

- [x] 创建用户列表组件（`UserList.jsx`）
  - 获取并显示所有用户
  - 点击用户进入聊天界面

- [x] 实现基础路由和状态管理
  - 登录状态保存到`localStorage`
  - 未登录跳转到登录页
  - 登录后显示用户列表

- [x] 测试认证流程
  - 注册新用户
  - 登录验证
  - 用户列表显示

---

### **阶段 2：实时通信（无加密）** 💬 ✅ **已完成**

#### 后端任务
- [x] 集成WebSocket服务器
  - 使用`ws`库创建WebSocket服务器
  - 与HTTP服务器共享端口或使用独立端口

- [x] 实现在线用户管理
  - 维护映射表：`Map<userId, websocket>`
  - WebSocket连接时绑定userId
  - 断开连接时清理

- [x] 实现消息转发逻辑
  - 接收格式：`{ type: 'message', to: userId, content: 'text' }`
  - 查找目标用户的WebSocket连接
  - 转发消息
  - 同时存储到数据库

- [x] 实现历史消息API：`GET /api/messages/:userId`
  - 查询当前用户与指定用户的所有消息
  - 按时间顺序排序
  - 返回：`[{ from, to, content, timestamp }]`

#### 前端任务
- [x] 创建聊天窗口组件（`ChatWindow.jsx`）
  - 消息列表展示区（滚动容器）
  - 消息气泡样式（发送/接收区分左右）
  - 输入框 + 发送按钮

- [x] 实现WebSocket连接管理
  - 登录后建立WebSocket连接
  - 发送用户身份信息
  - 监听服务器消息

- [x] 实现消息发送功能
  - 输入框内容发送给服务器
  - 实时更新聊天界面

- [x] 实现消息接收功能
  - 监听WebSocket消息事件
  - 解析并显示到聊天窗口

- [x] 加载历史消息
  - 打开聊天窗口时请求历史记录
  - 渲染到消息列表

#### 测试
- [x] 端到端测试
  - 打开两个浏览器窗口（或无痕模式）
  - 登录两个不同用户
  - 测试双向实时消息收发
  - 刷新页面后历史消息是否正常显示

---

### **阶段 3：混合加密核心功能** 🔐 **（重点）** ✅ **已完成**

#### 前端加密模块
- [x] 创建加密工具类（`utils/crypto.js`）

- [x] 实现RSA密钥对生成函数
  ```javascript
  async function generateRSAKeyPair() {
    // 使用 Web Crypto API
    // 算法：RSA-OAEP, 模数长度：2048
    // 返回：{ publicKey, privateKey }
  }
  ```

- [x] 实现密钥导出/导入函数
  ```javascript
  async function exportPublicKey(publicKey)  // → PEM格式字符串
  async function exportPrivateKey(privateKey) // → JWK格式
  async function importPublicKey(pemString)  // PEM → CryptoKey
  async function importPrivateKey(jwk)       // JWK → CryptoKey
  ```

- [x] 实现AES密钥生成函数
  ```javascript
  async function generateAESKey() {
    // 算法：AES-GCM, 密钥长度：256位
    // 返回：CryptoKey
  }
  ```

- [x] 实现AES加密/解密函数
  ```javascript
  async function encryptWithAES(key, plaintext) {
    // 生成随机IV
    // 返回：{ ciphertext, iv }
  }
  
  async function decryptWithAES(key, ciphertext, iv) {
    // 返回：plaintext
  }
  ```

- [x] 实现RSA加密/解密函数（用于密钥交换）
  ```javascript
  async function encryptWithRSA(publicKey, data)
  async function decryptWithRSA(privateKey, encryptedData)
  ```

#### 集成加密到注册流程
- [x] 修改前端注册逻辑
  - 生成RSA密钥对
  - 私钥存储到localStorage（JWK格式）
  - 公钥PEM格式发送给服务器

- [x] 修改后端注册API
  - 新增`public_key`字段接收
  - 存储到数据库

#### 集成加密到聊天流程
- [x] 前端：实现密钥管理
  - 为每个聊天对象维护AES密钥
  - 存储格式：`localStorage["aesKey_<userId1>_<userId2>"]`

- [x] 前端：首次聊天密钥交换
  - 检测是否存在AES密钥
  - 不存在则：获取对方公钥 → 生成AES密钥 → RSA加密 → 通过WebSocket发送

- [x] 前端：修改发送消息逻辑
  ```javascript
  // 原：ws.send(plaintext)
  // 改为：
  const { ciphertext, iv } = await encryptWithAES(aesKey, plaintext)
  ws.send({ ciphertext, iv })
  ```

- [x] 后端：修改消息存储
  - 存储`encrypted_content`和`iv`
  - 不再存储明文

- [x] 前端：修改接收消息逻辑
  ```javascript
  // 接收到 { ciphertext, iv }
  const plaintext = await decryptWithAES(aesKey, ciphertext, iv)
  // 显示 plaintext
  ```

- [x] 前端：修改历史消息加载
  - 从服务器获取密文+IV
  - 逐条解密后显示

#### 后端API补充
- [x] 实现获取用户公钥API：`GET /api/users/:id/publickey`
  - 返回指定用户的RSA公钥（PEM格式）

#### 安全性验证
- [x] 检查数据库`messages`表
  - 确认存储的是密文（乱码）
  
- [x] 检查浏览器Network面板
  - 确认WebSocket传输的是密文

- [x] 测试服务器无法解密
  - 服务器只中转密文，无AES密钥无法解密

---

### **阶段 4：完善与测试** ✨

#### 功能完善
- [ ] 添加在线状态指示
  - 用户列表显示绿点（在线）/灰点（离线）

- [ ] 消息时间戳显示
  - 格式化为`HH:mm`或`YYYY-MM-DD HH:mm`

- [ ] 错误处理
  - WebSocket断开重连机制
  - API请求失败提示
  - 加密/解密异常捕获

- [ ] 输入验证
  - 用户名长度限制（3-20字符）
  - 密码强度提示（至少6位）
  - 消息不为空校验

#### UI优化
- [ ] 基础样式美化
  - 响应式布局
  - 消息气泡样式
  - 发送/接收消息左右对齐
  - 输入框焦点样式

- [ ] 用户体验优化
  - 发送消息后自动滚动到底部
  - Enter发送消息，Shift+Enter换行
  - 发送中加载状态

#### 综合测试场景
- [ ] **测试场景1：完整流程**
  1. 用户A注册（生成密钥对）
  2. 用户B注册（生成密钥对）
  3. A给B发送消息"Hello"
  4. B收到并正确解密
  5. B回复"Hi"
  6. A收到并正确解密

- [ ] **测试场景2：历史消息**
  1. A和B互发10条消息
  2. B刷新浏览器
  3. 历史消息正确加载并解密

- [ ] **测试场景3：多用户**
  1. 创建用户A、B、C
  2. A分别与B、C聊天
  3. 确认密钥隔离（A-B的消息C无法解密）

- [ ] **测试场景4：安全性**
  1. 查看数据库messages表（应为密文）
  2. 查看Network传输内容（应为密文）
  3. 验证服务器无法解密消息

---

### **阶段 5：文档编写** 📄

- [ ] 编写README.md
  - 项目简介
  - 技术栈说明
  - 混合加密算法原理
    - 流程图（可用Mermaid）
    - RSA+AES工作机制
  - 安装步骤
    ```bash
    # 后端
    cd server
    npm install
    npm start
    
    # 前端
    cd client
    npm install
    npm start
    ```
  - 使用说明
  - 功能截图
  - 安全性说明

- [ ] 添加关键代码注释
  - 加密/解密函数
  - 密钥生成逻辑
  - WebSocket消息处理

- [ ] 创建演示脚本（可选）
  - 快速启动脚本
  - 测试数据初始化

---

## 📅 时间规划建议

| 天数 | 阶段 | 任务 | 验收标准 |
|------|------|------|----------|
| **Day 1-2** | 阶段 0 + 阶段 1 | 项目搭建 + 用户认证 | 能注册登录，看到用户列表 |
| **Day 3-4** | 阶段 2 | 实时通信 | 能实时聊天（明文），历史消息正常 |
| **Day 5-6** | 阶段 3 | 混合加密 | 消息加密传输，数据库存密文 |
| **Day 7** | 阶段 4 + 阶段 5 | 优化测试 + 文档 | 系统完整可演示，README完善 |

---

## 🎯 项目亮点（演示时强调）

1. **端到端加密**：服务器完全无法查看消息内容
2. **混合加密**：RSA保护密钥交换，AES保证加密效率
3. **实时通信**：WebSocket实现低延迟消息推送
4. **密钥隔离**：每对用户独立加密，互不干扰
5. **前端加密**：使用浏览器原生Web Crypto API，安全可靠

---

## 📚 参考资源

### 技术文档
- [Web Crypto API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [WebSocket - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Express.js 官方文档](https://expressjs.com/)
- [SQLite Node.js 文档](https://github.com/TryGhost/node-sqlite3)

### 加密算法
- RSA-OAEP：非对称加密，用于密钥交换
- AES-GCM：对称加密，用于消息加密
- bcrypt：密码哈希算法

---

## ⚠️ 注意事项

1. **私钥安全**：localStorage存储私钥需加密（生产环境应使用IndexedDB + 密码派生密钥）
2. **会话管理**：当前使用简单token，生产环境应使用JWT + HTTPS
3. **密钥备份**：当前方案清除浏览器数据会丢失私钥，生产环境需密钥恢复机制
4. **性能优化**：大量消息场景需要虚拟滚动和分页加载
5. **浏览器兼容性**：Web Crypto API需现代浏览器（Chrome 37+, Firefox 34+）

---

## 🚀 开始开发

**准备好了吗？** 

启动第一个阶段：
```bash
# 创建项目文件夹
mkdir -p secure-chat-system/{client,server,docs}
cd secure-chat-system
```

然后在新的聊天会话中，向AI Agent说：
> "开始实现阶段0：项目初始化"

祝开发顺利！💪
