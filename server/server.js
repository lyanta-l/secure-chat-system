/**
 * 混合加密聊天系统 - 主服务器入口
 * 提供HTTP API和WebSocket实时通信服务
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const db = require('./db');

// 创建Express应用
const app = express();
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 中间件
app.use(cors());
app.use(express.json());

// 在线用户管理 Map<userId, WebSocket>
const onlineUsers = new Map();

// 基础路由
app.get('/', (req, res) => {
  res.json({ 
    message: '混合加密聊天系统API',
    version: '1.0.0',
    status: 'running'
  });
});

// 广播在线用户列表给所有连接的用户
function broadcastOnlineUsers() {
  const onlineUserIds = Array.from(onlineUsers.keys());
  const message = JSON.stringify({
    type: 'onlineUsers',
    userIds: onlineUserIds
  });
  
  onlineUsers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// WebSocket连接处理
wss.on('connection', (ws) => {
  console.log('新的WebSocket连接');
  
  let userId = null;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // 用户身份验证
      if (data.type === 'auth') {
        userId = data.userId;
        onlineUsers.set(userId, ws);
        console.log(`用户 ${userId} 已连接`);
        
        // 通知用户连接成功
        ws.send(JSON.stringify({ type: 'auth_success', userId }));
        
        // 广播在线用户列表
        broadcastOnlineUsers();
      }
      
      // 密钥交换
      if (data.type === 'keyExchange') {
        console.log(`密钥交换: 从 ${data.from} 到 ${data.to}`);
        
        // 转发加密的密钥给目标用户
        const targetWs = onlineUsers.get(data.to);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify({
            type: 'keyExchange',
            from: data.from,
            encryptedKey: data.encryptedKey
          }));
          console.log('密钥已转发');
        } else {
          console.log('目标用户不在线，密钥交换失败');
        }
      }
      
      // 消息转发
      if (data.type === 'message') {
        console.log(`消息: 从 ${data.from} 到 ${data.to}`);
        
        const timestamp = new Date().toISOString();
        
        // 保存加密消息和IV到数据库
        db.run(
          'INSERT INTO messages (from_user_id, to_user_id, encrypted_content, iv) VALUES (?, ?, ?, ?)',
          [data.from, data.to, data.content, data.iv],
          (err) => {
            if (err) {
              console.error('保存消息到数据库失败:', err);
            }
          }
        );
        
        // 转发给目标用户（包含加密内容和IV）
        const targetWs = onlineUsers.get(data.to);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify({
            type: 'message',
            from: data.from,
            content: data.content,
            iv: data.iv,
            timestamp: timestamp
          }));
        }
      }
    } catch (error) {
      console.error('WebSocket消息处理错误:', error);
    }
  });
  
  ws.on('close', () => {
    if (userId) {
      onlineUsers.delete(userId);
      console.log(`用户 ${userId} 已断开连接`);
      
      // 广播在线用户列表
      broadcastOnlineUsers();
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });
});

// 路由导入
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
app.use('/api', authRoutes);
app.use('/api', messageRoutes);

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 WebSocket服务已启动`);
  console.log(`📊 数据库已初始化\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    db.close();
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = { app, server, wss, onlineUsers };

