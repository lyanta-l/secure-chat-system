/**
 * 聊天窗口组件
 * 显示消息列表和发送消息
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [aesKey, setAesKey] = useState(null);
  const [isKeyReady, setIsKeyReady] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
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
              
              const normalizedContent = normalizeMessageContent(decryptedContent);
              setMessages((prev) => [
                ...prev,
                {
                  fromUserId: data.from,
                  toUserId: currentUserId,
                  content: normalizedContent,
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
                content: { type: 'text', text: '[消息解密失败]' },
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
                return { ...msg, content: normalizeMessageContent(decryptedContent) };
              } else {
                // 没有密钥或未加密的消息（旧消息）
                return { ...msg, content: normalizeMessageContent(msg.content) };
              }
            } catch (error) {
              console.error('解密消息失败:', error);
              return { ...msg, content: { type: 'text', text: '[消息解密失败]' } };
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
    
    const trimmed = inputMessage.trim();
    if (!trimmed) {
      return;
    }

    if (trimmed.length > 5000) {
      alert('消息过长，请不要超过5000个字符');
      return;
    }

    try {
      await sendEncryptedPayload({ type: 'text', text: trimmed });
      setInputMessage('');
    } catch (err) {
      console.error('发送消息失败:', err);
      alert('发送失败,请重试');
    }
  };

  const sendEncryptedPayload = async (payload) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      alert('连接已断开，请刷新页面重试');
      throw new Error('WebSocket disconnected');
    }

    if (!aesKey || !isKeyReady) {
      alert('加密密钥正在初始化中，请稍等片刻后重试');
      throw new Error('AES key not ready');
    }

    const timestamp = new Date().toISOString();
    const plaintext = JSON.stringify(payload);
    const { ciphertext, iv } = await encryptWithAES(aesKey, plaintext);

    const messageData = {
      type: 'message',
      from: currentUserId,
      to: selectedUser.id,
      content: ciphertext,
      iv: iv,
      timestamp: timestamp,
    };

    ws.send(JSON.stringify(messageData));

    setMessages((prev) => [
      ...prev,
      {
        fromUserId: currentUserId,
        toUserId: selectedUser.id,
        content: normalizeMessageContent(payload),
        timestamp,
      },
    ]);
  };

  const handleFileButtonClick = () => {
    if (!isConnected) {
      alert('连接未就绪，稍后再试');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');

      const response = await axios.post('/uploads', formData, {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.file) {
        const fileMeta = response.data.file;
        await sendEncryptedPayload({
          type: 'file',
          file: {
            url: fileMeta.url,
            name: fileMeta.originalName,
            mimeType: fileMeta.mimeType,
            size: fileMeta.size,
            fileType: fileMeta.fileType,
          },
        });
      } else {
        alert('上传失败，请重试');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败，请检查网络或文件类型');
    } finally {
      event.target.value = '';
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

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const highlightText = (text, query) => {
    if (!query) {
      return text;
    }

    const escapedQuery = escapeRegExp(query);
    const regex = new RegExp(escapedQuery, 'gi');
    const matches = text.match(regex);

    if (!matches) {
      return text;
    }

    const parts = text.split(regex);

    return parts.reduce((acc, part, index) => {
      acc.push(<span key={`text-${index}`}>{part}</span>);
      if (matches[index]) {
        acc.push(
          <mark key={`mark-${index}`} className="search-highlight">
            {matches[index]}
          </mark>
        );
      }
      return acc;
    }, []);
  };

  const normalizeMessageContent = (rawContent) => {
    if (!rawContent) {
      return { type: 'text', text: '' };
    }

    if (typeof rawContent === 'object' && rawContent.type) {
      return rawContent;
    }

    if (typeof rawContent === 'string') {
      try {
        const parsed = JSON.parse(rawContent);
        if (parsed && parsed.type) {
          return parsed;
        }
      } catch (err) {
        // ignore
      }
      return { type: 'text', text: rawContent };
    }

    return { type: 'text', text: String(rawContent) };
  };

  const getSearchableText = (content) => {
    if (!content) return '';
    if (content.type === 'text') {
      return content.text || '';
    }
    if (content.type === 'file') {
      return content.file?.name || '';
    }
    return '';
  };

  const formatFileSize = (size) => {
    if (!size && size !== 0) {
      return '';
    }
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatFileName = (name = '') => {
    if (!name) return '附件';
    if (name.length <= 24) {
      return name;
    }
    const extIndex = name.lastIndexOf('.');
    const ext = extIndex > 0 ? name.slice(extIndex) : '';
    const base = extIndex > 0 ? name.slice(0, extIndex) : name;
    return `${base.slice(0, 12)}...${ext}`;
  };

  const getFileTypeLabel = (mimeType = '') => {
    const map = {
      'application/pdf': 'PDF',
      'application/msword': 'Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
      'application/vnd.ms-excel': 'Excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
      'application/vnd.ms-powerpoint': 'PPT',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPT',
      'application/zip': 'ZIP',
      'application/x-zip-compressed': 'ZIP',
      'text/plain': 'TXT',
    };

    if (map[mimeType]) {
      return map[mimeType];
    }

    if (!mimeType) {
      return '文件';
    }

    const subtype = mimeType.split('/').pop();
    return subtype ? subtype.toUpperCase() : '文件';
  };

  const isImageFile = (file) => {
    if (!file) return false;
    if (file.fileType === 'image') return true;
    return file.mimeType?.startsWith('image/');
  };

  const renderMessageContent = (content) => {
    if (!content || content.type === 'text') {
      return (
        <div className="message-content">
          {highlightText(content?.text || '', searchQuery.trim())}
        </div>
      );
    }

    if (content.type === 'file' && content.file) {
      const file = content.file;
      if (isImageFile(file)) {
        return (
          <div className="attachment-block image-only">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              download={file.name || 'image'}
            >
              <img
                src={file.url}
                alt={file.name || 'image attachment'}
                className="image-attachment"
              />
            </a>
          </div>
        );
      }

      return (
        <div className="attachment-block">
          <div className="attachment-card">
            <div className="attachment-icon">📄</div>
            <div className="attachment-info">
              <div className="attachment-name" title={file.name || '附件'}>
                {formatFileName(file.name)}
              </div>
              <div className="attachment-meta">
                {getFileTypeLabel(file.mimeType)} · {formatFileSize(file.size)}
              </div>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="attachment-download"
              download={file.name || 'attachment'}
            >
              下载
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="message-content">
        {content ? JSON.stringify(content) : ''}
      </div>
    );
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) {
      return messages;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return messages.filter((msg) =>
      getSearchableText(msg.content).toLowerCase().includes(lowerQuery)
    );
  }, [messages, searchQuery]);

  const displayMessages = searchQuery.trim() ? filteredMessages : messages;

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
              {isConnected && isKeyReady ? '安全连接' : isConnected ? '密钥初始化中...' : '连接中...'}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-search-bar">
        <input
          type="text"
          placeholder="搜索聊天记录..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="chat-search-input"
        />
        {searchQuery && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchQuery('')}
          >
            清除
          </button>
        )}
      </div>

      {searchQuery && (
        <div className="search-results-info">
          {filteredMessages.length > 0
            ? `共找到 ${filteredMessages.length} 条相关消息`
            : '未找到相关消息'}
        </div>
      )}

      <div className="messages-container">
        {displayMessages.length === 0 ? (
          <div className="no-messages">
            {searchQuery ? '未找到相关消息, 换个关键词试试?' : '暂无消息,开始聊天吧!'}
          </div>
        ) : (
          displayMessages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.fromUserId === currentUserId ? 'sent' : 'received'
              }`}
            >
              <div className="message-bubble">
                {renderMessageContent(msg.content)}
                <div className="message-time">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <button
          type="button"
          className="file-upload-btn"
          onClick={handleFileButtonClick}
          title="发送文件"
        >
          📎
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          type="text"
          className="message-input"
          placeholder="输入消息..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          maxLength={5000}
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

