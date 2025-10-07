/**
 * 聊天窗口组件
 * 显示消息列表和发送消息
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from '../utils/axiosConfig';
import { useWebSocket } from '../contexts/WebSocketContext';
import '../styles/ChatWindow.css';
import {
  generateAESKey,
  encryptWithAES,
  decryptWithAES,
  exportAESKey,
  importAESKey,
  importPublicKey,
  importPrivateKey,
  encryptWithRSA,
  decryptWithRSA,
} from '../utils/crypto';

function ChatWindow({ selectedUser, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [aesKey, setAesKey] = useState(null);
  const [isKeyReady, setIsKeyReady] = useState(false);
  const messagesEndRef = useRef(null);
  const { ws, isConnected, addMessageHandler } = useWebSocket();
  const currentUserId = parseInt(localStorage.getItem('userId'));
  const currentUsername = localStorage.getItem('username');

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化AES密钥 - 密钥交换逻辑
  useEffect(() => {
    const initializeAESKey = async () => {
      try {
        const keyStorageKey = `aesKey_${currentUserId}_${selectedUser.id}`;
        const storedKeyJWK = localStorage.getItem(keyStorageKey);
        
        if (storedKeyJWK) {
          // 已有密钥，直接导入
          const key = await importAESKey(JSON.parse(storedKeyJWK));
          setAesKey(key);
          setIsKeyReady(true);
          console.log('已加载AES密钥');
        } else {
          // 首次聊天，生成新的AES密钥
          const newKey = await generateAESKey();
          const keyJWK = await exportAESKey(newKey);
          localStorage.setItem(keyStorageKey, JSON.stringify(keyJWK));
          setAesKey(newKey);
          setIsKeyReady(true);
          console.log('已生成新的AES密钥');
          
          // 获取对方的公钥
          const response = await axios.get(`/users/${selectedUser.id}/publickey`);
          if (response.data.success && response.data.publicKey) {
            const recipientPublicKey = await importPublicKey(response.data.publicKey);
            
            // 用对方的RSA公钥加密AES密钥
            const keyBuffer = new TextEncoder().encode(JSON.stringify(keyJWK));
            const encryptedKey = await encryptWithRSA(recipientPublicKey, keyBuffer);
            
            // 等待WebSocket准备就绪，然后发送密钥
            const sendKey = () => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'keyExchange',
                  from: currentUserId,
                  to: selectedUser.id,
                  encryptedKey: encryptedKey,
                }));
                console.log('已发送加密的AES密钥');
              } else {
                // WebSocket还没准备好，稍后重试
                console.log('WebSocket未就绪，1秒后重试发送密钥...');
                setTimeout(sendKey, 1000);
              }
            };
            sendKey();
          }
        }
      } catch (error) {
        console.error('初始化AES密钥失败:', error);
        setIsKeyReady(false);
      }
    };
    
    // 只要有选中用户且WebSocket就绪就初始化密钥
    if (selectedUser && ws && ws.readyState === WebSocket.OPEN) {
      initializeAESKey();
    }
  }, [selectedUser, currentUserId, ws]);

  // 处理WebSocket消息
  useEffect(() => {
    const handleMessage = async (data) => {
      if (data.type === 'keyExchange') {
        // 接收到密钥交换请求
        try {
          // 使用自己的RSA私钥解密AES密钥
          const privateKeyJWK = JSON.parse(
            localStorage.getItem(`privateKey_${currentUsername}`)
          );
          const privateKey = await importPrivateKey(privateKeyJWK);
          const decryptedKeyBuffer = await decryptWithRSA(privateKey, data.encryptedKey);
          const keyJWK = JSON.parse(new TextDecoder().decode(decryptedKeyBuffer));
          
          // 保存AES密钥
          const keyStorageKey = `aesKey_${currentUserId}_${data.from}`;
          localStorage.setItem(keyStorageKey, JSON.stringify(keyJWK));
          
          // 如果是当前聊天对象，立即加载密钥
          if (data.from === selectedUser.id) {
            const key = await importAESKey(keyJWK);
            setAesKey(key);
            setIsKeyReady(true);
          }
          
          console.log('已接收并保存AES密钥');
        } catch (error) {
          console.error('处理密钥交换失败:', error);
        }
      } else if (data.type === 'message') {
        // 只显示与当前聊天对象的消息
        if (data.from === selectedUser.id) {
          try {
            // 解密消息
            const keyStorageKey = `aesKey_${currentUserId}_${data.from}`;
            const keyJWK = JSON.parse(localStorage.getItem(keyStorageKey));
            if (keyJWK) {
              const key = await importAESKey(keyJWK);
              const decryptedContent = await decryptWithAES(key, data.content, data.iv);
              
              setMessages((prev) => [
                ...prev,
                {
                  fromUserId: data.from,
                  toUserId: currentUserId,
                  content: decryptedContent,
                  timestamp: data.timestamp,
                },
              ]);
            }
          } catch (error) {
            console.error('解密消息失败:', error);
            // 显示解密失败的消息
            setMessages((prev) => [
              ...prev,
              {
                fromUserId: data.from,
                toUserId: currentUserId,
                content: '[消息解密失败]',
                timestamp: data.timestamp,
              },
            ]);
          }
        }
      }
    };

    // 注册消息处理器
    const removeHandler = addMessageHandler(handleMessage);
    
    return removeHandler;
  }, [currentUserId, currentUsername, selectedUser.id, addMessageHandler]);

  // 加载历史消息
  useEffect(() => {
    fetchMessages();
  }, [selectedUser]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/messages/${selectedUser.id}`,
        {
          headers: { Authorization: token },
        }
      );

      if (response.data.success) {
        // 解密历史消息
        const decryptedMessages = await Promise.all(
          response.data.messages.map(async (msg) => {
            try {
              // 获取对应的AES密钥
              const otherUserId = msg.fromUserId === currentUserId 
                ? msg.toUserId 
                : msg.fromUserId;
              const keyStorageKey = `aesKey_${currentUserId}_${otherUserId}`;
              const keyJWK = localStorage.getItem(keyStorageKey);
              
              if (keyJWK && msg.iv && msg.iv !== 'placeholder') {
                const key = await importAESKey(JSON.parse(keyJWK));
                const decryptedContent = await decryptWithAES(key, msg.content, msg.iv);
                return { ...msg, content: decryptedContent };
              } else {
                // 没有密钥或未加密的消息（旧消息）
                return msg;
              }
            } catch (error) {
              console.error('解密消息失败:', error);
              return { ...msg, content: '[消息解密失败]' };
            }
          })
        );
        setMessages(decryptedMessages);
      }
    } catch (err) {
      console.error('获取消息历史失败:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // 输入验证
    if (!inputMessage.trim()) {
      return;
    }
    
    if (inputMessage.length > 5000) {
      alert('消息过长，请不要超过5000个字符');
      return;
    }
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      alert('连接已断开，请刷新页面重试');
      return;
    }
    
    if (!aesKey || !isKeyReady) {
      alert('加密密钥正在初始化中，请稍等片刻后重试');
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const plaintext = inputMessage;
      
      // 使用AES加密消息
      const { ciphertext, iv } = await encryptWithAES(aesKey, plaintext);
      
      const messageData = {
        type: 'message',
        from: currentUserId,
        to: selectedUser.id,
        content: ciphertext,
        iv: iv,
        timestamp: timestamp,
      };

      // 通过WebSocket发送加密消息(服务器会自动保存到数据库)
      ws.send(JSON.stringify(messageData));

      // 立即在界面显示自己发送的消息（显示明文）
      setMessages((prev) => [
        ...prev,
        {
          fromUserId: currentUserId,
          toUserId: selectedUser.id,
          content: plaintext,
          timestamp: timestamp,
        },
      ]);

      setInputMessage('');
    } catch (err) {
      console.error('发送消息失败:', err);
      alert('发送失败,请重试');
    }
  };

  // 格式化时间戳 - 今天显示时间，其他日期显示日期+时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = 
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <div className="chat-window-container">
      <div className="chat-header">
        <button onClick={onBack} className="back-btn">
          ← 返回
        </button>
        <div className="chat-user-info">
          <div className="chat-avatar">
            {selectedUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="chat-user-details">
            <span className="chat-username">{selectedUser.username}</span>
            <span className={`connection-status ${isConnected && isKeyReady ? 'connected' : 'disconnected'}`}>
              {isConnected && isKeyReady ? '🔐 安全连接' : isConnected ? '🔄 密钥初始化中...' : '连接中...'}
            </span>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">暂无消息,开始聊天吧!</div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.fromUserId === currentUserId ? 'sent' : 'received'
              }`}
            >
              <div className="message-bubble">
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          placeholder="输入消息... (Enter发送)"
          className="message-input"
          disabled={!isConnected}
        />
        <button 
          type="submit" 
          className="send-btn"
          disabled={!isConnected || !isKeyReady || !inputMessage.trim()}
        >
          发送
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;

