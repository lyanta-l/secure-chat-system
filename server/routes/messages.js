/**
 * 消息相关API路由
 * 包括获取历史消息、保存消息等
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { sessions } = require('./auth');

/**
 * 获取与指定用户的历史消息
 * GET /api/messages/:userId
 * Headers: { Authorization: token }
 */
router.get('/messages/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization;
    const currentUserId = sessions.get(token);
    
    if (!currentUserId) {
      return res.status(401).json({ 
        success: false, 
        message: '未授权' 
      });
    }
    
    const targetUserId = req.params.userId;
    
    // 查询双向消息记录
    const messages = await db.allAsync(`
      SELECT 
        id,
        from_user_id as fromUserId,
        to_user_id as toUserId,
        encrypted_content as content,
        iv,
        created_at as timestamp
      FROM messages
      WHERE 
        (from_user_id = ? AND to_user_id = ?) OR
        (from_user_id = ? AND to_user_id = ?)
      ORDER BY created_at ASC
    `, [currentUserId, targetUserId, targetUserId, currentUserId]);
    
    res.json({ 
      success: true, 
      messages 
    });
    
  } catch (error) {
    console.error('获取消息历史错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

/**
 * 保存消息到数据库
 * POST /api/messages
 * Body: { toUserId, encryptedContent, iv }
 */
router.post('/messages', async (req, res) => {
  try {
    const token = req.headers.authorization;
    const fromUserId = sessions.get(token);
    
    if (!fromUserId) {
      return res.status(401).json({ 
        success: false, 
        message: '未授权' 
      });
    }
    
    const { toUserId, encryptedContent, iv } = req.body;
    
    if (!toUserId || !encryptedContent || !iv) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数' 
      });
    }
    
    // 保存消息
    const result = await db.runAsync(`
      INSERT INTO messages (from_user_id, to_user_id, encrypted_content, iv)
      VALUES (?, ?, ?, ?)
    `, [fromUserId, toUserId, encryptedContent, iv]);
    
    res.status(201).json({ 
      success: true,
      messageId: result.lastID,
      message: '消息已保存' 
    });
    
  } catch (error) {
    console.error('保存消息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

module.exports = router;

