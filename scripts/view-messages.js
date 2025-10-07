#!/usr/bin/env node

/**
 * 数据库消息查看工具
 * 用于查看数据库中存储的加密消息
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../server/database.db');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function printHeader(text) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  ${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

function printSection(text) {
  console.log(`\n${colors.bright}${colors.yellow}${text}${colors.reset}`);
  console.log(`${colors.yellow}${'-'.repeat(80)}${colors.reset}`);
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
});

// 查看统计信息
function viewStatistics() {
  return new Promise((resolve, reject) => {
    printSection('📊 数据库统计信息');
    
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        console.error('查询用户数失败:', err);
        return reject(err);
      }
      console.log(`总用户数: ${colors.green}${row.count}${colors.reset}`);
      
      db.get('SELECT COUNT(*) as count FROM messages', (err, row) => {
        if (err) {
          console.error('查询消息数失败:', err);
          return reject(err);
        }
        console.log(`总消息数: ${colors.green}${row.count}${colors.reset}`);
        resolve();
      });
    });
  });
}

// 查看所有用户
function viewUsers() {
  return new Promise((resolve, reject) => {
    printSection('👥 用户列表');
    
    db.all('SELECT id, username, created_at FROM users ORDER BY id', (err, rows) => {
      if (err) {
        console.error('查询用户失败:', err);
        return reject(err);
      }
      
      if (rows.length === 0) {
        console.log('暂无用户');
      } else {
        console.log(`\n${'ID'.padEnd(6)}${'用户名'.padEnd(20)}注册时间`);
        console.log('-'.repeat(80));
        rows.forEach(row => {
          console.log(`${String(row.id).padEnd(6)}${row.username.padEnd(20)}${row.created_at}`);
        });
      }
      resolve();
    });
  });
}

// 查看所有消息
function viewMessages(limit = 50) {
  return new Promise((resolve, reject) => {
    printSection(`💬 消息记录（最近 ${limit} 条）`);
    
    const query = `
      SELECT 
        m.id,
        u1.username as from_user,
        u2.username as to_user,
        SUBSTR(m.encrypted_content, 1, 60) as content_preview,
        m.iv,
        m.created_at
      FROM messages m
      JOIN users u1 ON m.from_user_id = u1.id
      JOIN users u2 ON m.to_user_id = u2.id
      ORDER BY m.created_at DESC
      LIMIT ?
    `;
    
    db.all(query, [limit], (err, rows) => {
      if (err) {
        console.error('查询消息失败:', err);
        return reject(err);
      }
      
      if (rows.length === 0) {
        console.log('暂无消息');
      } else {
        rows.forEach(msg => {
          console.log(`\n${colors.blue}消息 #${msg.id}${colors.reset}`);
          console.log(`  发送者: ${colors.green}${msg.from_user}${colors.reset} → 接收者: ${colors.green}${msg.to_user}${colors.reset}`);
          console.log(`  时间: ${msg.created_at}`);
          console.log(`  加密内容（前60字符）: ${colors.magenta}${msg.content_preview}...${colors.reset}`);
          console.log(`  IV: ${msg.iv ? msg.iv.substring(0, 30) + '...' : 'N/A'}`);
        });
      }
      resolve();
    });
  });
}

// 按用户查看消息
function viewMessagesByUser(userId1, userId2) {
  return new Promise((resolve, reject) => {
    printSection(`💬 用户 ${userId1} 与 ${userId2} 的对话记录`);
    
    const query = `
      SELECT 
        m.id,
        m.from_user_id,
        m.to_user_id,
        u1.username as from_user,
        u2.username as to_user,
        m.encrypted_content,
        m.iv,
        m.created_at
      FROM messages m
      JOIN users u1 ON m.from_user_id = u1.id
      JOIN users u2 ON m.to_user_id = u2.id
      WHERE 
        (m.from_user_id = ? AND m.to_user_id = ?) OR
        (m.from_user_id = ? AND m.to_user_id = ?)
      ORDER BY m.created_at ASC
    `;
    
    db.all(query, [userId1, userId2, userId2, userId1], (err, rows) => {
      if (err) {
        console.error('查询消息失败:', err);
        return reject(err);
      }
      
      if (rows.length === 0) {
        console.log(`这两个用户之间没有消息记录`);
      } else {
        rows.forEach(msg => {
          const direction = msg.from_user_id === userId1 ? '→' : '←';
          console.log(`\n[${msg.created_at}] ${colors.green}${msg.from_user}${colors.reset} ${direction} ${colors.green}${msg.to_user}${colors.reset}`);
          console.log(`  加密内容: ${colors.magenta}${msg.encrypted_content.substring(0, 80)}...${colors.reset}`);
          console.log(`  IV: ${msg.iv ? msg.iv.substring(0, 40) : 'N/A'}`);
        });
        console.log(`\n总计: ${rows.length} 条消息`);
      }
      resolve();
    });
  });
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  printHeader('🔍 SecureChat 数据库消息查看工具');
  
  try {
    if (args.length === 0) {
      // 默认模式：显示统计和最近消息
      await viewStatistics();
      await viewUsers();
      await viewMessages(20);
    } else if (args[0] === '--all') {
      // 显示所有消息
      const limit = args[1] ? parseInt(args[1]) : 100;
      await viewStatistics();
      await viewMessages(limit);
    } else if (args[0] === '--users') {
      // 只显示用户列表
      await viewUsers();
    } else if (args[0] === '--stats') {
      // 只显示统计信息
      await viewStatistics();
    } else if (args[0] === '--chat' && args[1] && args[2]) {
      // 显示两个用户之间的对话
      const userId1 = parseInt(args[1]);
      const userId2 = parseInt(args[2]);
      await viewMessagesByUser(userId1, userId2);
    } else {
      // 显示帮助信息
      console.log('使用方法:');
      console.log('  node view-messages.js              # 显示统计、用户和最近20条消息');
      console.log('  node view-messages.js --all [数量] # 显示所有消息（默认100条）');
      console.log('  node view-messages.js --users      # 只显示用户列表');
      console.log('  node view-messages.js --stats      # 只显示统计信息');
      console.log('  node view-messages.js --chat <用户ID1> <用户ID2>  # 显示两个用户的对话');
      console.log('\n示例:');
      console.log('  node view-messages.js --chat 1 2   # 查看用户1和用户2的对话');
    }
  } catch (error) {
    console.error('执行出错:', error);
  } finally {
    db.close();
    console.log(`\n${colors.cyan}数据库已关闭${colors.reset}\n`);
  }
}

main();

