/**
 * 认证相关API路由
 * 包括注册、登录、获取用户列表等
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// 会话存储 Map<token, userId>
const sessions = new Map();

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
    
    // 生成会话token
    const token = uuidv4();
    sessions.set(token, user.id);
    
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

module.exports = router;
module.exports.sessions = sessions;

