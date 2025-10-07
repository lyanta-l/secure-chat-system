#!/usr/bin/env node

/**
 * 加密功能验证脚本
 * 检查端到端加密系统的核心功能
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'secure-chat-system/server/chat.db');

console.log('🔍 验证端到端加密系统...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 无法打开数据库:', err.message);
    process.exit(1);
  }
});

// 验证用户表中的公钥
db.all('SELECT id, username, public_key FROM users', [], (err, users) => {
  if (err) {
    console.error('❌ 查询用户失败:', err.message);
    return;
  }

  console.log('👥 注册用户信息:');
  console.log('================');
  
  if (users.length === 0) {
    console.log('⚠️  没有注册用户。请先注册至少2个用户。\n');
  } else {
    users.forEach(user => {
      const hasPublicKey = user.public_key ? '✅' : '❌';
      const keyPreview = user.public_key 
        ? user.public_key.substring(0, 50) + '...' 
        : '无';
      console.log(`${hasPublicKey} 用户: ${user.username} (ID: ${user.id})`);
      console.log(`   公钥: ${keyPreview}`);
    });
    console.log('');
  }
});

// 验证消息表中的加密内容
db.all('SELECT id, from_user_id, to_user_id, encrypted_content, iv, created_at FROM messages ORDER BY id DESC LIMIT 5', [], (err, messages) => {
  if (err) {
    console.error('❌ 查询消息失败:', err.message);
    return;
  }

  console.log('💬 最近的消息（最多5条）:');
  console.log('==========================');
  
  if (messages.length === 0) {
    console.log('⚠️  没有消息记录。请发送一些消息测试加密功能。\n');
  } else {
    messages.forEach(msg => {
      const isEncrypted = msg.encrypted_content && 
                         msg.iv && 
                         msg.iv !== 'placeholder' &&
                         !msg.encrypted_content.includes('Hello') && // 简单检查不是明文
                         !msg.encrypted_content.includes('你好');
      
      const status = isEncrypted ? '✅ 已加密' : '❌ 未加密/明文';
      const contentPreview = msg.encrypted_content.substring(0, 30) + '...';
      const ivPreview = msg.iv ? msg.iv.substring(0, 20) + '...' : '无';
      
      console.log(`\n消息 ID ${msg.id}: ${status}`);
      console.log(`  从: 用户${msg.from_user_id} -> 到: 用户${msg.to_user_id}`);
      console.log(`  密文: ${contentPreview}`);
      console.log(`  IV: ${ivPreview}`);
      console.log(`  时间: ${msg.created_at}`);
    });
    console.log('');
  }
  
  // 统计加密状态
  const encryptedCount = messages.filter(msg => 
    msg.iv && msg.iv !== 'placeholder'
  ).length;
  
  const totalCount = messages.length;
  
  if (totalCount > 0) {
    console.log('📊 加密统计:');
    console.log('============');
    console.log(`总消息数: ${totalCount}`);
    console.log(`加密消息: ${encryptedCount} (${(encryptedCount/totalCount*100).toFixed(1)}%)`);
    console.log(`未加密消息: ${totalCount - encryptedCount}`);
    console.log('');
    
    if (encryptedCount === totalCount) {
      console.log('✅ 所有消息都已加密！端到端加密系统工作正常。');
    } else if (encryptedCount > 0) {
      console.log('⚠️  部分消息已加密。可能有些是测试阶段1-2的旧消息。');
    } else {
      console.log('❌ 没有加密消息。请检查加密实现。');
    }
  }
  
  db.close((err) => {
    if (err) {
      console.error('❌ 关闭数据库失败:', err.message);
    }
    
    console.log('\n📝 提示:');
    console.log('- 如果看到明文消息，说明加密未启用');
    console.log('- 如果看到Base64密文和IV，说明加密正常工作');
    console.log('- 运行完整测试请参考 STAGE3_TESTING.md');
  });
});

