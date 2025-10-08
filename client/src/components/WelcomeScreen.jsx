/**
 * 欢迎界面组件
 * 当没有选择用户时显示的主界面
 */

import React from 'react';
import '../styles/WelcomeScreen.css';

function WelcomeScreen() {
  const currentUsername = localStorage.getItem('username');

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">
          <div className="chat-icon">💬</div>
        </div>
        <h1>选择对话</h1>
        <p className="welcome-subtitle">
          你好，{currentUsername}
        </p>
        <p className="welcome-description">
          从左侧选择一个用户开始对话
        </p>
        <div className="features">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span>端到端加密</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span>实时消息</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
