/**
 * 登录/注册组件
 * 提供用户认证界面
 * 修复了git版本控制问题 - 现在可以正常跟踪前端文件更改
 */

import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import '../styles/Login.css';
import {
  generateRSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
} from '../utils/crypto';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 组件加载时，检查是否有保存的用户名（会话失效后重新登录）
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername && !localStorage.getItem('token')) {
      // 有用户名但没有 token，说明会话失效了
      setUsername(savedUsername);
      setError('会话已失效，请重新登录');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // 输入验证
    if (username.length < 3 || username.length > 20) {
      setError('用户名长度必须在3-20个字符之间');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('用户名只能包含字母、数字和下划线');
      return;
    }
    
    if (password.length < 6) {
      setError('密码长度至少6个字符');
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        // 登录逻辑
        const response = await axios.post('/login', {
          username,
          password,
        });

        if (response.data.success) {
          // 保存登录信息到localStorage
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userId', response.data.userId);
          localStorage.setItem('username', response.data.username);
          
          // 检查是否有该用户的私钥（用于解密历史消息）
          const privateKeyKey = `privateKey_${response.data.username}`;
          const hasPrivateKey = localStorage.getItem(privateKeyKey);
          
          if (!hasPrivateKey) {
            console.warn('警告: 未找到该用户的私钥，将无法解密历史消息');
            setError('登录成功，但未找到加密密钥。您将无法查看历史消息。');
            setTimeout(() => {
              onLogin(response.data);
            }, 2000);
          } else {
            console.log('成功加载用户私钥');
            onLogin(response.data);
          }
        }
      } else {
        // 注册逻辑 - 生成RSA密钥对
        const keyPair = await generateRSAKeyPair();
        const publicKeyPEM = await exportPublicKey(keyPair.publicKey);
        const privateKeyJWK = await exportPrivateKey(keyPair.privateKey);
        
        const response = await axios.post('/register', {
          username,
          password,
          publicKey: publicKeyPEM,
        });

        if (response.data.success) {
          // 保存私钥到localStorage（与用户名关联）
          localStorage.setItem(`privateKey_${username}`, JSON.stringify(privateKeyJWK));
          
          setError('注册成功！请登录');
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || '操作失败,请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>混合加密聊天系统</h1>
        <h2>{isLogin ? '登录' : '注册'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名 (3-20个字符)"
              required
              minLength={3}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码 (至少6个字符)"
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className="toggle-mode">
          <button onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}>
            {isLogin ? '没有账号?点击注册' : '已有账号?点击登录'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

