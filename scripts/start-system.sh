#!/bin/bash

# 安全聊天系统启动脚本
# 此脚本会自动启动后端服务器和前端应用

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔒  安全聊天系统 - 启动脚本  🔒${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查Node.js
echo -e "${BLUE}[1/5]${NC} 检查Node.js安装..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到Node.js，请先安装Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js版本: $(node --version)${NC}"
echo ""

# 检查npm
echo -e "${BLUE}[2/5]${NC} 检查npm安装..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到npm，请先安装npm${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm版本: $(npm --version)${NC}"
echo ""

# 检查依赖
echo -e "${BLUE}[3/5]${NC} 检查项目依赖..."

# 检查服务器依赖
if [ ! -d "$PROJECT_ROOT/server/node_modules" ]; then
    echo -e "${YELLOW}⚠️  服务器依赖未安装，开始安装...${NC}"
    cd "$PROJECT_ROOT/server"
    npm install
    echo -e "${GREEN}✅ 服务器依赖安装完成${NC}"
else
    echo -e "${GREEN}✅ 服务器依赖已安装${NC}"
fi

# 检查客户端依赖
if [ ! -d "$PROJECT_ROOT/client/node_modules" ]; then
    echo -e "${YELLOW}⚠️  客户端依赖未安装，开始安装...${NC}"
    cd "$PROJECT_ROOT/client"
    npm install
    echo -e "${GREEN}✅ 客户端依赖安装完成${NC}"
else
    echo -e "${GREEN}✅ 客户端依赖已安装${NC}"
fi
echo ""

# 检查端口占用
echo -e "${BLUE}[4/5]${NC} 检查端口状态..."

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  端口3001已被占用，正在尝试关闭...${NC}"
    PID=$(lsof -t -i:3001)
    kill $PID 2>/dev/null
    sleep 1
    echo -e "${GREEN}✅ 端口3001已释放${NC}"
else
    echo -e "${GREEN}✅ 端口3001可用${NC}"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  端口3000已被占用，正在尝试关闭...${NC}"
    PID=$(lsof -t -i:3000)
    kill $PID 2>/dev/null
    sleep 1
    echo -e "${GREEN}✅ 端口3000已释放${NC}"
else
    echo -e "${GREEN}✅ 端口3000可用${NC}"
fi
echo ""

# 启动服务
echo -e "${BLUE}[5/5]${NC} 启动服务..."
echo ""

# 启动后端服务器
echo -e "${CYAN}🚀 启动后端服务器...${NC}"
cd "$PROJECT_ROOT/server"
node server.js &
SERVER_PID=$!

sleep 2

# 检查服务器是否启动成功
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ 后端服务器启动成功 (PID: $SERVER_PID)${NC}"
    echo -e "${GREEN}   URL: http://localhost:3001${NC}"
else
    echo -e "${RED}❌ 后端服务器启动失败${NC}"
    exit 1
fi

echo ""

# 启动前端应用
echo -e "${CYAN}🎨 启动前端应用...${NC}"
cd "$PROJECT_ROOT/client"
PORT=3000 npm start &
CLIENT_PID=$!

sleep 3

# 检查前端是否启动成功
if ps -p $CLIENT_PID > /dev/null; then
    echo -e "${GREEN}✅ 前端应用启动成功 (PID: $CLIENT_PID)${NC}"
    echo -e "${GREEN}   URL: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ 前端应用启动失败${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 系统启动成功！${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📌 服务信息:${NC}"
echo -e "   • 后端服务器: ${CYAN}http://localhost:3001${NC} (PID: ${SERVER_PID})"
echo -e "   • 前端应用:   ${CYAN}http://localhost:3000${NC} (PID: ${CLIENT_PID})"
echo ""
echo -e "${YELLOW}💡 使用提示:${NC}"
echo -e "   1. 打开浏览器访问: ${CYAN}http://localhost:3000${NC}"
echo -e "   2. 如果看到错误，请先清除LocalStorage:"
echo -e "      ${CYAN}file://$PROJECT_ROOT/client/public/clear-localStorage.html${NC}"
echo -e "   3. 注册用户名并开始聊天"
echo ""
echo -e "${YELLOW}🛑 停止服务:${NC}"
echo -e "   • 按 ${RED}Ctrl+C${NC} 停止当前脚本"
echo -e "   • 或运行: ${CYAN}./scripts/stop-system.sh${NC}"
echo -e "   • 或手动: ${CYAN}kill ${SERVER_PID} ${CLIENT_PID}${NC}"
echo ""
echo -e "${YELLOW}🧪 运行测试:${NC}"
echo -e "   ${CYAN}node scripts/test-chat-system.js${NC}"
echo ""
echo -e "${YELLOW}📚 查看文档:${NC}"
echo -e "   • README:      ${CYAN}cat docs/README.md${NC}"
echo -e "   • 使用指南:    ${CYAN}cat docs/USAGE_GUIDE.md${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 保存PID到文件
echo $SERVER_PID > "$PROJECT_ROOT/.server.pid"
echo $CLIENT_PID > "$PROJECT_ROOT/.client.pid"

# 等待用户中断
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务...${NC}"
echo ""

# 捕获Ctrl+C信号
trap "echo ''; echo -e '${YELLOW}正在关闭服务...${NC}'; kill $SERVER_PID 2>/dev/null; kill $CLIENT_PID 2>/dev/null; rm -f '$PROJECT_ROOT/.server.pid' '$PROJECT_ROOT/.client.pid'; echo -e '${GREEN}✅ 所有服务已关闭${NC}'; exit 0" INT

# 保持脚本运行
wait

