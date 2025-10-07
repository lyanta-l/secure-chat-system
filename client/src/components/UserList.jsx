/**
 * 用户列表组件
 * 显示所有可聊天的用户，包含在线状态指示
 */

import React, { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import { useWebSocket } from '../contexts/WebSocketContext';
import '../styles/UserList.css';

function UserList({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const { addMessageHandler } = useWebSocket();
  const currentUsername = localStorage.getItem('username');

  useEffect(() => {
    fetchUsers();
    
    // 注册消息处理器以接收在线状态
    const removeHandler = addMessageHandler((data) => {
      if (data.type === 'onlineUsers') {
        setOnlineUserIds(data.userIds);
      }
    });
    
    return removeHandler;
  }, [addMessageHandler]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/users', {
        headers: { Authorization: token },
      });

      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      setError('获取用户列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // 调用登出 API
        await axios.post('/logout', {}, {
          headers: { Authorization: token },
        });
      }
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      // 只清除会话相关的数据，保留加密密钥和其他重要数据
      // 保留：privateKey_xxx（RSA私钥）、aesKey_xxx_yyy（AES会话密钥）
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      // username保留，方便下次登录时自动填充
      
      
      window.location.reload();
    }
  };

  if (loading) {
    return <div className="user-list-container">加载中...</div>;
  }

  if (error) {
    return <div className="user-list-container error">{error}</div>;
  }

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h2>💬 聊天列表</h2>
        <div className="current-user">
          <span>当前用户: {currentUsername}</span>
          <button onClick={handleLogout} className="logout-btn">
            退出登录
          </button>
        </div>
      </div>

      <div className="users">
        {users.length === 0 ? (
          <div className="no-users">暂无其他用户</div>
        ) : (
          users.map((user) => {
            const isOnline = onlineUserIds.includes(user.id);
            return (
              <div
                key={user.id}
                className="user-item"
                onClick={() => onSelectUser(user)}
              >
                <div className="user-avatar-wrapper">
                  <div className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className={`online-indicator ${isOnline ? 'online' : 'offline'}`}></span>
                </div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div className="user-status">
                    {isOnline ? '在线' : '离线'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default UserList;

