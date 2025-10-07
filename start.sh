#!/bin/bash

# 混合加密聊天系统 - 快速启动脚本

echo "🚀 启动混合加密聊天系统..."
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 启动后端服务器
echo "📡 启动后端服务器..."
cd server
npm start &
SERVER_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端应用
echo "🌐 启动前端应用..."
cd client
npm start &
CLIENT_PID=$!
cd ..

echo ""
echo "✅ 系统启动成功!"
echo ""
echo "📊 后端服务器: http://localhost:3001"
echo "🌐 前端应用: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获中断信号，优雅关闭
trap "echo ''; echo '🛑 正在关闭服务...'; kill $SERVER_PID $CLIENT_PID; exit" INT

# 保持脚本运行
wait

