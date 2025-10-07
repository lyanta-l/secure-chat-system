#!/usr/bin/env node

/**
 * 安全聊天系统自动化测试脚本
 * 测试所有主要功能
 */

const WebSocket = require('ws');
const crypto = require('crypto');

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// 测试结果统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0
};

// 打印函数
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
  stats.passed++;
  stats.total++;
}

function fail(message) {
  log(`❌ ${message}`, colors.red);
  stats.failed++;
  stats.total++;
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function section(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${colors.bold}${message}`, colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// RSA密钥对生成
function generateRSAKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
}

// AES加密
function encryptAES(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex')
  };
}

// AES解密
function decryptAES(encryptedData, key) {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  );
  let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// RSA加密
function encryptRSA(text, publicKey) {
  return crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(text)
  ).toString('base64');
}

// RSA解密
function decryptRSA(encryptedText, privateKey) {
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encryptedText, 'base64')
  ).toString('utf8');
}

// 模拟用户类
class TestUser {
  constructor(username) {
    this.username = username;
    this.ws = null;
    this.keyPair = generateRSAKeyPair();
    this.aesKeys = {}; // 存储与其他用户的AES密钥
    this.messages = [];
    this.onlineUsers = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://localhost:3001`);
      
      this.ws.on('open', () => {
        info(`${this.username} WebSocket连接成功`);
        
        // 发送身份验证消息
        this.ws.send(JSON.stringify({
          type: 'auth',
          userId: this.username
        }));
        
        setTimeout(() => resolve(), 500);
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        reject(error);
      });
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'auth_success':
        info(`${this.username} 身份验证成功`);
        break;

      case 'onlineUsers':
        this.onlineUsers = message.userIds.filter(u => u !== this.username);
        info(`${this.username} 收到在线用户: ${this.onlineUsers.join(', ') || '(无其他用户)'}`);
        break;

      case 'keyExchange':
        // 收到加密的AES密钥
        try {
          const decryptedKey = decryptRSA(message.encryptedKey, this.keyPair.privateKey);
          this.aesKeys[message.from] = decryptedKey;
          info(`${this.username} 收到并解密了 ${message.from} 的AES密钥`);
        } catch (error) {
          info(`${this.username} 解密 ${message.from} 的密钥失败`);
        }
        break;

      case 'message':
        // 解密消息
        const key = this.aesKeys[message.from];
        if (key) {
          try {
            const decrypted = decryptAES({
              ciphertext: message.content,
              iv: message.iv
            }, key);
            
            this.messages.push({
              from: message.from,
              content: decrypted,
              timestamp: message.timestamp
            });
            
            info(`${this.username} 收到来自 ${message.from} 的消息: "${decrypted}"`);
          } catch (error) {
            info(`${this.username} 解密消息失败`);
          }
        } else {
          info(`${this.username} 收到消息但没有密钥`);
        }
        break;
    }
  }

  async sendMessage(to, content) {
    const key = this.aesKeys[to];
    if (!key) {
      throw new Error(`没有与 ${to} 的AES密钥`);
    }

    const encrypted = encryptAES(content, key);
    
    this.ws.send(JSON.stringify({
      type: 'message',
      from: this.username,
      to: to,
      content: encrypted.ciphertext,
      iv: encrypted.iv
    }));
    
    info(`${this.username} 发送加密消息给 ${to}: "${content}"`);
  }

  async exchangeKeys(targetUser) {
    // 生成AES密钥
    const aesKey = crypto.randomBytes(32).toString('hex');
    this.aesKeys[targetUser] = aesKey;
    
    // 需要先获取对方的公钥（这里我们假设通过其他方式获得）
    // 为了测试，我们直接使用对方用户的公钥
    // 在实际应用中，这应该通过服务器或其他安全渠道获取
    
    info(`${this.username} 准备与 ${targetUser} 交换密钥`);
    await delay(300);
  }
  
  async sendKeyExchange(targetUser, targetPublicKey) {
    const aesKey = crypto.randomBytes(32).toString('hex');
    this.aesKeys[targetUser] = aesKey;
    
    const encryptedKey = encryptRSA(aesKey, targetPublicKey);
    
    this.ws.send(JSON.stringify({
      type: 'keyExchange',
      from: this.username,
      to: targetUser,
      encryptedKey: encryptedKey
    }));
    
    info(`${this.username} 发送密钥给 ${targetUser}`);
    await delay(300);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      info(`${this.username} 断开连接`);
    }
  }
}

// 测试函数
async function runTests() {
  section('🚀 开始安全聊天系统自动化测试');

  // 测试1: 基本连接测试
  section('测试 1: 基本连接测试');
  try {
    const user1 = new TestUser('Alice');
    await user1.connect();
    await delay(500);
    
    if (user1.ws && user1.ws.readyState === WebSocket.OPEN) {
      success('用户连接成功');
    } else {
      fail('用户连接失败');
    }
    
    user1.disconnect();
    await delay(500);
  } catch (error) {
    fail(`连接测试失败: ${error.message}`);
  }

  // 测试2: 多用户连接测试
  section('测试 2: 多用户连接测试');
  try {
    const alice = new TestUser('Alice');
    const bob = new TestUser('Bob');
    
    await alice.connect();
    await delay(500);
    await bob.connect();
    await delay(1000);
    
    if (alice.onlineUsers.includes('Bob') && bob.onlineUsers.includes('Alice')) {
      success('多用户连接成功，用户列表正确');
    } else {
      fail('用户列表不正确');
    }
    
    alice.disconnect();
    bob.disconnect();
    await delay(500);
  } catch (error) {
    fail(`多用户连接测试失败: ${error.message}`);
  }

  // 测试3: 密钥交换测试
  section('测试 3: 密钥交换测试');
  try {
    const alice = new TestUser('Alice');
    const bob = new TestUser('Bob');
    
    await alice.connect();
    await delay(500);
    await bob.connect();
    await delay(500);
    
    // Alice与Bob交换密钥
    await alice.sendKeyExchange('Bob', bob.keyPair.publicKey);
    await delay(500);
    await bob.sendKeyExchange('Alice', alice.keyPair.publicKey);
    await delay(1000);
    
    if (alice.aesKeys['Bob'] && bob.aesKeys['Alice']) {
      success('密钥交换成功');
    } else {
      fail('密钥交换失败');
    }
    
    alice.disconnect();
    bob.disconnect();
    await delay(500);
  } catch (error) {
    fail(`密钥交换测试失败: ${error.message}`);
  }

  // 测试4: 端到端加密消息传输测试
  section('测试 4: 端到端加密消息传输测试');
  try {
    const alice = new TestUser('Alice');
    const bob = new TestUser('Bob');
    
    await alice.connect();
    await delay(500);
    await bob.connect();
    await delay(500);
    
    // 密钥交换
    await alice.sendKeyExchange('Bob', bob.keyPair.publicKey);
    await delay(500);
    await bob.sendKeyExchange('Alice', alice.keyPair.publicKey);
    await delay(1000);
    
    // Alice发送消息给Bob
    const testMessage1 = 'Hello Bob! 这是一条测试消息 🚀';
    await alice.sendMessage('Bob', testMessage1);
    await delay(1000);
    
    // Bob发送消息给Alice
    const testMessage2 = 'Hi Alice! 收到你的消息了 👍';
    await bob.sendMessage('Alice', testMessage2);
    await delay(1000);
    
    // 验证消息
    const bobReceivedMsg = bob.messages.find(m => m.from === 'Alice');
    const aliceReceivedMsg = alice.messages.find(m => m.from === 'Bob');
    
    if (bobReceivedMsg && bobReceivedMsg.content === testMessage1) {
      success('Bob正确接收并解密了Alice的消息');
    } else {
      fail('Bob未能正确接收Alice的消息');
    }
    
    if (aliceReceivedMsg && aliceReceivedMsg.content === testMessage2) {
      success('Alice正确接收并解密了Bob的消息');
    } else {
      fail('Alice未能正确接收Bob的消息');
    }
    
    alice.disconnect();
    bob.disconnect();
    await delay(500);
  } catch (error) {
    fail(`消息传输测试失败: ${error.message}`);
  }

  // 测试5: 多轮对话测试
  section('测试 5: 多轮对话测试');
  try {
    const alice = new TestUser('Alice');
    const bob = new TestUser('Bob');
    
    await alice.connect();
    await delay(500);
    await bob.connect();
    await delay(500);
    
    // 密钥交换
    await alice.sendKeyExchange('Bob', bob.keyPair.publicKey);
    await delay(500);
    await bob.sendKeyExchange('Alice', alice.keyPair.publicKey);
    await delay(1000);
    
    // 发送多条消息
    const messages = [
      { from: 'Alice', to: 'Bob', content: '消息1' },
      { from: 'Bob', to: 'Alice', content: '消息2' },
      { from: 'Alice', to: 'Bob', content: '消息3' },
      { from: 'Bob', to: 'Alice', content: '消息4' },
      { from: 'Alice', to: 'Bob', content: '消息5' }
    ];
    
    for (const msg of messages) {
      const sender = msg.from === 'Alice' ? alice : bob;
      await sender.sendMessage(msg.to, msg.content);
      await delay(500);
    }
    
    await delay(1000);
    
    if (bob.messages.length === 3 && alice.messages.length === 2) {
      success(`多轮对话测试通过 (Alice收到${alice.messages.length}条, Bob收到${bob.messages.length}条)`);
    } else {
      fail(`消息数量不正确 (Alice收到${alice.messages.length}条, Bob收到${bob.messages.length}条)`);
    }
    
    alice.disconnect();
    bob.disconnect();
    await delay(500);
  } catch (error) {
    fail(`多轮对话测试失败: ${error.message}`);
  }

  // 测试6: 三人对话测试
  section('测试 6: 三人对话测试');
  try {
    const alice = new TestUser('Alice');
    const bob = new TestUser('Bob');
    const charlie = new TestUser('Charlie');
    
    await alice.connect();
    await delay(500);
    await bob.connect();
    await delay(500);
    await charlie.connect();
    await delay(500);
    
    // Alice与Bob交换密钥
    await alice.sendKeyExchange('Bob', bob.keyPair.publicKey);
    await delay(500);
    await bob.sendKeyExchange('Alice', alice.keyPair.publicKey);
    await delay(500);
    
    // Alice与Charlie交换密钥
    await alice.sendKeyExchange('Charlie', charlie.keyPair.publicKey);
    await delay(500);
    await charlie.sendKeyExchange('Alice', alice.keyPair.publicKey);
    await delay(500);
    
    // Bob与Charlie交换密钥
    await bob.sendKeyExchange('Charlie', charlie.keyPair.publicKey);
    await delay(500);
    await charlie.sendKeyExchange('Bob', bob.keyPair.publicKey);
    await delay(1000);
    
    // Alice给Bob发消息
    await alice.sendMessage('Bob', 'Hi Bob from Alice');
    await delay(500);
    
    // Alice给Charlie发消息
    await alice.sendMessage('Charlie', 'Hi Charlie from Alice');
    await delay(500);
    
    // Bob给Charlie发消息
    await bob.sendMessage('Charlie', 'Hi Charlie from Bob');
    await delay(1000);
    
    // 验证Charlie收到了两条消息
    const charlieFromAlice = charlie.messages.find(m => m.from === 'Alice');
    const charlieFromBob = charlie.messages.find(m => m.from === 'Bob');
    
    if (charlieFromAlice && charlieFromBob && charlie.messages.length === 2) {
      success('三人对话测试通过，消息隔离正确');
    } else {
      fail('三人对话测试失败');
    }
    
    alice.disconnect();
    bob.disconnect();
    charlie.disconnect();
    await delay(500);
  } catch (error) {
    fail(`三人对话测试失败: ${error.message}`);
  }

  // 测试7: 用户离线检测测试
  section('测试 7: 用户离线检测测试');
  try {
    const alice = new TestUser('Alice');
    const bob = new TestUser('Bob');
    
    await alice.connect();
    await delay(500);
    await bob.connect();
    await delay(1000);
    
    const initialOnlineCount = alice.onlineUsers.length;
    
    // Bob断开连接
    bob.disconnect();
    await delay(1500);
    
    // 检查Alice的在线用户列表是否更新
    if (alice.onlineUsers.length < initialOnlineCount || !alice.onlineUsers.includes('Bob')) {
      success('用户离线检测成功');
    } else {
      // 在线用户列表应该通过onlineUsers消息更新
      fail('未检测到用户离线（用户列表未更新）');
    }
    
    alice.disconnect();
    await delay(500);
  } catch (error) {
    fail(`离线检测测试失败: ${error.message}`);
  }

  // 测试8: 特殊字符和表情符号测试
  section('测试 8: 特殊字符和表情符号测试');
  try {
    const alice = new TestUser('Alice');
    const bob = new TestUser('Bob');
    
    await alice.connect();
    await delay(500);
    await bob.connect();
    await delay(500);
    
    await alice.sendKeyExchange('Bob', bob.keyPair.publicKey);
    await delay(500);
    await bob.sendKeyExchange('Alice', alice.keyPair.publicKey);
    await delay(1000);
    
    const specialMessage = '特殊字符测试: @#$%^&*() 中文测试 表情符号: 🎉🚀💻🔒🌟';
    await alice.sendMessage('Bob', specialMessage);
    await delay(1000);
    
    const received = bob.messages.find(m => m.from === 'Alice');
    
    if (received && received.content === specialMessage) {
      success('特殊字符和表情符号正确传输');
    } else {
      fail('特殊字符传输失败');
    }
    
    alice.disconnect();
    bob.disconnect();
    await delay(500);
  } catch (error) {
    fail(`特殊字符测试失败: ${error.message}`);
  }

  // 打印测试总结
  section('📊 测试总结');
  log(`\n总测试数: ${stats.total}`, colors.bold);
  log(`通过: ${stats.passed}`, colors.green);
  log(`失败: ${stats.failed}`, colors.red);
  log(`通过率: ${((stats.passed / stats.total) * 100).toFixed(2)}%`, colors.cyan);
  
  if (stats.failed === 0) {
    log('\n🎉 所有测试通过！系统运行正常！', colors.green + colors.bold);
  } else {
    log('\n⚠️  部分测试失败，请检查系统配置', colors.yellow + colors.bold);
  }
  
  process.exit(stats.failed === 0 ? 0 : 1);
}

// 运行测试
runTests().catch(error => {
  console.error(`${colors.red}测试运行出错: ${error.message}${colors.reset}`);
  process.exit(1);
});

