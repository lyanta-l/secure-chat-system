/**
 * 主布局组件
 * 提供侧边栏+主内容区域的布局结构
 */

import React, { useEffect, useState } from 'react';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import WelcomeScreen from './WelcomeScreen';
import '../styles/MainLayout.css';

function MainLayout({ selectedUser, onSelectUser, onBackToList }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (isMobile) {
    if (!selectedUser) {
      return (
        <div className="main-layout">
          <div className="sidebar">
            <UserList onSelectUser={onSelectUser} />
          </div>
        </div>
      );
    }

    return (
      <div className="main-layout">
        <div className="main-content">
          <ChatWindow selectedUser={selectedUser} onBack={onBackToList} />
        </div>
      </div>
    );
  }

  return (
    <div className="main-layout">
      {/* 侧边栏 - 用户列表 */}
      <div className="sidebar">
        <UserList onSelectUser={onSelectUser} />
      </div>
      
      {/* 主内容区域 */}
      <div className="main-content">
        {selectedUser ? (
          <ChatWindow selectedUser={selectedUser} onBack={onBackToList} />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
}

export default MainLayout;
