# 👥 团队协作开发指南

> 安全聊天系统 - 团队协作开发完整指南

[![GitHub](https://img.shields.io/badge/GitHub-协作开发-black)](https://github.com/lyanta-l/secure-chat-system)
[![Git](https://img.shields.io/badge/Git-版本控制-orange)](https://git-scm.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

---

## 📋 目录

- [快速开始](#-快速开始)
- [团队角色分工](#-团队角色分工)
- [开发环境配置](#-开发环境配置)
- [Git 工作流程](#-git-工作流程)
- [代码规范](#-代码规范)
- [功能开发指南](#-功能开发指南)
- [测试与调试](#-测试与调试)
- [部署与发布](#-部署与发布)
- [常见问题](#-常见问题)

---

## 🚀 快速开始

### 新成员加入项目

1. **克隆项目到本地**
```bash
git clone https://github.com/lyanta-l/secure-chat-system.git
cd secure-chat-system
```

2. **安装依赖**
```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

3. **启动开发环境**
```bash
# 启动后端服务（在 server 目录）
npm run dev

# 启动前端服务（在 client 目录，新终端）
npm start
```

4. **访问应用**
- 前端：http://localhost:3000
- 后端：http://localhost:5000

---

## 👥 团队角色分工

### 建议的角色分配

| 角色 | 职责 | 主要工作内容 |
|------|------|-------------|
| **项目负责人** | 整体协调、代码审查 | 分配任务、合并PR、发布版本 |
| **前端开发** | 用户界面、用户体验 | React组件、样式、交互逻辑 |
| **后端开发** | 服务器逻辑、数据库 | API接口、Socket.io、加密算法 |
| **测试工程师** | 质量保证、测试用例 | 功能测试、性能测试、安全测试 |
| **运维工程师** | 部署、监控、维护 | 服务器配置、CI/CD、监控 |

### 当前项目结构

```
secure-chat-system/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript类型
├── server/                 # 后端代码
│   ├── src/
│   │   ├── routes/         # API路由
│   │   ├── middleware/     # 中间件
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
├── docs/                   # 文档
└── tests/                  # 测试文件
```

---

## 🔧 开发环境配置

### 必需软件

1. **Node.js 18+**
```bash
# 使用 nvm 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

2. **Git**
```bash
sudo apt update
sudo apt install git
```

3. **代码编辑器**
- VS Code（推荐）
- WebStorm
- Sublime Text

### VS Code 推荐插件

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json"
  ]
}
```

---

## 🌿 Git 工作流程

### 分支策略

```
main (主分支)
├── develop (开发分支)
├── feature/功能名称 (功能分支)
├── bugfix/问题描述 (修复分支)
└── hotfix/紧急修复 (热修复分支)
```

### 开发流程

1. **创建功能分支**
```bash
# 从 develop 分支创建新功能分支
git checkout develop
git pull origin develop
git checkout -b feature/用户认证系统
```

2. **开发并提交**
```bash
# 添加文件到暂存区
git add .

# 提交更改
git commit -m "feat: 添加用户登录功能

- 实现RSA密钥生成
- 添加登录界面
- 集成Socket.io连接"

# 推送到远程分支
git push origin feature/用户认证系统
```

3. **创建 Pull Request**
- 在 GitHub 上创建 PR
- 请求代码审查
- 通过审查后合并到 develop

4. **发布版本**
```bash
# 合并到 main 分支
git checkout main
git merge develop
git tag v1.0.0
git push origin main --tags
```

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<类型>[可选范围]: <描述>

[可选正文]

[可选脚注]
```

**类型说明：**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例：**
```bash
git commit -m "feat(auth): 添加RSA密钥生成功能"
git commit -m "fix(chat): 修复消息加密解密问题"
git commit -m "docs: 更新API文档"
```

---

## 📝 代码规范

### TypeScript 规范

```typescript
// 接口命名使用 PascalCase
interface UserInfo {
  id: string;
  username: string;
  publicKey: string;
}

// 函数命名使用 camelCase
const generateRSAKeyPair = async (): Promise<CryptoKeyPair> => {
  // 实现逻辑
};

// 组件命名使用 PascalCase
const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwn }) => {
  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`}>
      {message.content}
    </div>
  );
};
```

### 文件命名规范

```
components/
├── ChatMessage.tsx          # React组件
├── ChatMessage.test.tsx     # 测试文件
├── ChatMessage.module.css   # 样式文件
└── index.ts                 # 导出文件
```

### 代码审查清单

- [ ] 代码符合项目规范
- [ ] 没有控制台错误或警告
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 测试用例覆盖新功能
- [ ] 性能影响评估

---

## 🛠️ 功能开发指南

### 前端开发

1. **创建新组件**
```bash
# 在 client/src/components 下创建新组件
mkdir -p components/NewComponent
touch components/NewComponent/NewComponent.tsx
touch components/NewComponent/NewComponent.module.css
touch components/NewComponent/index.ts
```

2. **组件模板**
```typescript
import React from 'react';
import styles from './NewComponent.module.css';

interface NewComponentProps {
  // 定义props类型
}

const NewComponent: React.FC<NewComponentProps> = ({ ...props }) => {
  return (
    <div className={styles.container}>
      {/* 组件内容 */}
    </div>
  );
};

export default NewComponent;
```

### 后端开发

1. **创建新路由**
```bash
# 在 server/src/routes 下创建新路由文件
touch routes/newRoute.ts
```

2. **路由模板**
```typescript
import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

// GET 路由
router.get('/api/new-endpoint', async (req: Request, res: Response) => {
  try {
    // 处理逻辑
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

### Socket.io 开发

```typescript
// 服务端事件处理
io.on('connection', (socket) => {
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('send-message', (data: MessageData) => {
    // 处理消息加密
    const encryptedMessage = encryptMessage(data.content, data.publicKey);
    
    // 广播消息
    socket.to(data.roomId).emit('receive-message', {
      ...data,
      content: encryptedMessage
    });
  });
});
```

---

## 🧪 测试与调试

### 前端测试

```bash
# 运行测试
cd client
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 后端测试

```bash
# 运行测试
cd server
npm test

# 运行测试并监听文件变化
npm run test:watch
```

### 调试技巧

1. **前端调试**
```typescript
// 使用 React DevTools
console.log('Debug info:', { user, message });

// 使用断点调试
debugger;
```

2. **后端调试**
```typescript
// 使用 VS Code 调试配置
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/server/src/index.ts",
  "outFiles": ["${workspaceFolder}/server/dist/**/*.js"]
}
```

---

## 🚀 部署与发布

### 开发环境部署

```bash
# 启动开发服务器
npm run dev
```

### 生产环境部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

---

## ❓ 常见问题

### Q: 如何解决依赖安装问题？
A: 
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

### Q: 如何解决端口冲突？
A: 
```bash
# 查看端口占用
lsof -i :3000

# 杀死占用进程
kill -9 <PID>
```

### Q: 如何解决 Git 冲突？
A: 
```bash
# 拉取最新代码
git pull origin develop

# 解决冲突后
git add .
git commit -m "resolve: 解决合并冲突"
```

### Q: 如何回滚到上一个版本？
A: 
```bash
# 查看提交历史
git log --oneline

# 回滚到指定提交
git reset --hard <commit-hash>
```

---

## 📞 联系方式

- **项目仓库**: https://github.com/lyanta-l/secure-chat-system
- **问题反馈**: 在 GitHub Issues 中提交
- **讨论交流**: 使用 GitHub Discussions

---

## 📚 学习资源

- [React 官方文档](https://reactjs.org/docs)
- [Node.js 官方文档](https://nodejs.org/docs)
- [Socket.io 官方文档](https://socket.io/docs)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs)
- [Git 官方文档](https://git-scm.com/doc)

---

