# 🚀 快速开始指南

> 5分钟快速上手安全聊天系统开发

## 📥 新成员加入

### 1. 克隆项目
```bash
git clone https://github.com/lyanta-l/secure-chat-system.git
cd secure-chat-system
```

### 2. 安装依赖
```bash
# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd ../client && npm install
```

### 3. 启动项目
```bash
# 启动后端（终端1）
cd server
npm run dev

# 启动前端（终端2）
cd client
npm start
```

### 4. 访问应用
- 前端：http://localhost:3000
- 后端：http://localhost:5000

## 🔄 日常开发流程

### 1. 开始新功能
```bash
# 拉取最新代码
git checkout develop
git pull origin develop

# 创建功能分支
git checkout -b feature/你的功能名称
```

### 2. 开发并提交
```bash
# 添加更改
git add .

# 提交代码
git commit -m "feat: 添加新功能"

# 推送分支
git push origin feature/你的功能名称
```

### 3. 创建 Pull Request
- 访问：https://github.com/lyanta-l/secure-chat-system
- 点击 "New Pull Request"
- 选择你的分支 → develop
- 填写描述，请求代码审查

## 🛠️ 常用命令

```bash
# 查看项目状态
git status

# 查看分支
git branch

# 切换分支
git checkout 分支名

# 合并代码
git merge 分支名

# 查看提交历史
git log --oneline
```

## 📁 项目结构

```
secure-chat-system/
├── client/          # 前端代码
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── hooks/       # 自定义Hooks
│   │   └── utils/       # 工具函数
├── server/          # 后端代码
│   ├── src/
│   │   ├── routes/      # API路由
│   │   └── services/    # 业务逻辑
└── docs/            # 文档
```

## 🎯 开发任务分配

### 前端开发
- 用户界面设计
- React组件开发
- 用户交互逻辑
- 样式和布局

### 后端开发
- API接口开发
- Socket.io实时通信
- RSA加密算法
- 数据库设计

### 测试
- 功能测试
- 性能测试
- 安全测试

## ❓ 遇到问题？

1. **查看文档**: 阅读 `TEAM_COLLABORATION.md`
2. **GitHub Issues**: 在项目仓库提交问题
3. **团队讨论**: 使用 GitHub Discussions

## 📞 联系方式

- **项目地址**: https://github.com/lyanta-l/secure-chat-system
- **问题反馈**: GitHub Issues
- **团队讨论**: GitHub Discussions

---

**开始你的开发之旅吧！🎉**
