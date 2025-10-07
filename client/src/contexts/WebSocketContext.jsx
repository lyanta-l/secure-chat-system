/**
 * WebSocket上下文 - 提供全局WebSocket连接
 * 避免多个组件创建重复连接
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

const WebSocketContext = createContext(null);

const WS_URL = 'ws://localhost:3001';

export function WebSocketProvider({ children }) {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const messageHandlersRef = useRef(new Set());
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // 添加消息处理器
  const addMessageHandler = useCallback((handler) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // 建立WebSocket连接
  useEffect(() => {
    const currentUserId = parseInt(localStorage.getItem('userId'));
    if (!currentUserId) return;

    let websocket;

    const connect = () => {
      websocket = new WebSocket(WS_URL);

      websocket.onopen = () => {
        console.log('全局WebSocket已连接');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // 发送身份验证
        websocket.send(JSON.stringify({
          type: 'auth',
          userId: currentUserId,
        }));
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // 分发消息给所有注册的处理器
        messageHandlersRef.current.forEach((handler) => {
          handler(data);
        });
      };

      websocket.onerror = (error) => {
        console.error('全局WebSocket错误:', error);
        setIsConnected(false);
      };

      websocket.onclose = () => {
        console.log('全局WebSocket已断开');
        setIsConnected(false);

        // 自动重连逻辑
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const timeout = Math.min(1000 * reconnectAttemptsRef.current, 5000);
          console.log(`${timeout}ms后尝试重连... (第${reconnectAttemptsRef.current}次)`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, timeout);
        } else {
          alert('连接已断开，请刷新页面重试');
        }
      };

      setWs(websocket);
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  const value = {
    ws,
    isConnected,
    addMessageHandler,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket必须在WebSocketProvider内使用');
  }
  return context;
}

