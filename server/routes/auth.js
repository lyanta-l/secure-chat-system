/**
 * 认证相关API路由
 * 包括注册、登录、获取用户列表等
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// 会话存储 Map<token, userId> - 启动时从数据库加载
const sessions = new Map();

// 会话过期时间（7天）
const SESSION_EXPIRY_DAYS = 7;

// 从数据库加载所有有效会话
async function loadSessionsFromDatabase() {
  try {
    const now = new Date().toISOString();
    // 只加载未过期的会话
    const validSessions = await db.allAsync(
      'SELECT token, user_id FROM sessions WHERE expires_at > ?',
      [now]
    );
    
    validSessions.forEach(session => {
      sessions.set(session.token, session.user_id);
    });
    
    console.log(`✅ 从数据库加载了 ${validSessions.length} 个有效会话`);
    
    // 清理过期的会话
    await db.runAsync('DELETE FROM sessions WHERE expires_at <= ?', [now]);
  } catch (error) {
    console.error('加载会话失败:', error);
  }
}

// 启动时加载会话
loadSessionsFromDatabase();

// 保存会话到数据库
async function saveSession(token, userId) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
    
    await db.runAsync(
      'INSERT OR REPLACE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
      [token, userId, expiresAt.toISOString()]
    );
    
    sessions.set(token, userId);
  } catch (error) {
    console.error('保存会话失败:', error);
    throw error;
  }
}

// 删除会话
async function deleteSession(token) {
  try {
    await db.runAsync('DELETE FROM sessions WHERE token = ?', [token]);
    sessions.delete(token);
  } catch (error) {
    console.error('删除会话失败:', error);
  }
}

/**
 * 用户注册
 * POST /api/register
 * Body: { username, password, publicKey }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, publicKey } = req.body;
    
    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }
    
    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名长度必须在3-20个字符之间' 
      });
    }
    
    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: '密码至少需要6个字符' 
      });
    }
    
    // 检查用户名是否已存在
    const existingUser = await db.getAsync(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }
    
    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // 插入用户数据
    const result = await db.runAsync(
      'INSERT INTO users (username, password_hash, public_key) VALUES (?, ?, ?)',
      [username, passwordHash, publicKey || null]
    );
    
    res.status(201).json({ 
      success: true, 
      userId: result.lastID,
      message: '注册成功' 
    });
    
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

/**
 * 用户登录
 * POST /api/login
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }
    
    // 查询用户
    const user = await db.getAsync(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      [username]
    );
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
    
    // 生成会话token并保存到数据库
    const token = uuidv4();
    await saveSession(token, user.id);
    
    res.json({ 
      success: true, 
      token,
      userId: user.id,
      username: user.username,
      message: '登录成功' 
    });
    
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

/**
 * 获取所有用户列表
 * GET /api/users
 * Headers: { Authorization: token }
 */
router.get('/users', async (req, res) => {
  try {
    const token = req.headers.authorization;
    const currentUserId = sessions.get(token);
    
    if (!currentUserId) {
      return res.status(401).json({ 
        success: false, 
        message: '未授权' 
      });
    }
    
    // 获取除当前用户外的所有用户
    const users = await db.allAsync(
      'SELECT id, username, created_at FROM users WHERE id != ?',
      [currentUserId]
    );
    
    res.json({ 
      success: true, 
      users 
    });
    
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

/**
 * 获取指定用户的公钥
 * GET /api/users/:id/publickey
 */
router.get('/users/:id/publickey', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await db.getAsync(
      'SELECT public_key FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    
    res.json({ 
      success: true, 
      publicKey: user.public_key 
    });
    
  } catch (error) {
    console.error('获取公钥错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

/**
 * 验证会话是否有效
 * GET /api/verify-session
 * Headers: { Authorization: token }
 */
router.get('/verify-session', async (req, res) => {
  try {
    const token = req.headers.authorization;
    const userId = sessions.get(token);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: '会话无效或已过期' 
      });
    }
    
    // 获取用户信息
    const user = await db.getAsync(
      'SELECT id, username FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      // 用户已被删除，清除会话
      await deleteSession(token);
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    
    res.json({ 
      success: true,
      userId: user.id,
      username: user.username,
      message: '会话有效' 
    });
    
  } catch (error) {
    console.error('验证会话错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

/**
 * 登出
 * POST /api/logout
 * Headers: { Authorization: token }
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    if (token) {
      await deleteSession(token);
    }
    
    res.json({ 
      success: true, 
      message: '登出成功' 
    });
    
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

module.exports = router;
module.exports.sessions = sessions;

