/**
 * 主应用组件
 * 管理应用状态和路由
 */

import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import MainLayout from './components/MainLayout';
import { WebSocketProvider } from './contexts/WebSocketContext';
import axios from './utils/axiosConfig';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // 检查登录状态 - 验证 token 是否有效
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoggedIn(false);
        setIsCheckingSession(false);
        return;
      }

      try {
        // 验证 token 是否有效
        const response = await axios.get('/verify-session', {
          headers: { Authorization: token },
        });

        if (response.data.success) {
          // Token 有效，更新用户信息
          localStorage.setItem('userId', response.data.userId);
          localStorage.setItem('username', response.data.username);
          setIsLoggedIn(true);
        }
      } catch (error) {
        // Token 无效，清除认证信息（保留私钥）
        console.log('会话无效，需要重新登录');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setIsLoggedIn(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  // 正在检查会话状态
  if (isCheckingSession) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        正在验证登录状态...
      </div>
    );
  }

  // 未登录显示登录页面
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // 已登录，使用WebSocket Provider包裹所有需要WebSocket的组件
  return (
    <WebSocketProvider>
      <MainLayout 
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        onBackToList={handleBackToList}
      />
    </WebSocketProvider>
  );
}

export default App;
