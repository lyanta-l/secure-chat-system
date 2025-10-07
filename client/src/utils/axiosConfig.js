/**
 * Axios 配置和拦截器
 * 处理认证失败和自动登出
 */

import axios from 'axios';

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// 响应拦截器 - 处理 401 未授权错误
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token 失效或未授权
      const token = localStorage.getItem('token');
      
      if (token) {
        // 有 token 但失效了（服务器重启等原因）
        console.log('会话已失效，需要重新登录');
        
        // 只清除认证相关的数据，保留私钥和其他数据
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        
        // 不清除 username 和私钥，以便重新登录时可以恢复
        // localStorage.removeItem('username'); // 保留
        // localStorage.removeItem('privateKey_xxx'); // 保留
        
        // 重新加载页面，触发登录流程
        window.location.reload();
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

