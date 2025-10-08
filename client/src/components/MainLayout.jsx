/**
 * 主布局组件
 * 提供侧边栏+主内容区域的布局结构
 */

import React from 'react';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import WelcomeScreen from './WelcomeScreen';
import '../styles/MainLayout.css';

function MainLayout({ selectedUser, onSelectUser, onBackToList }) {
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
