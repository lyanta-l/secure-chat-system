#!/bin/bash

# 安全聊天系统停止脚本

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🛑  安全聊天系统 - 停止脚本  🛑${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 从PID文件读取并停止
if [ -f "$PROJECT_ROOT/.server.pid" ]; then
    SERVER_PID=$(cat "$PROJECT_ROOT/.server.pid")
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止后端服务器 (PID: $SERVER_PID)...${NC}"
        kill $SERVER_PID 2>/dev/null
        echo -e "${GREEN}✅ 后端服务器已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  后端服务器进程不存在${NC}"
    fi
    rm -f "$PROJECT_ROOT/.server.pid"
else
    echo -e "${YELLOW}⚠️  未找到后端服务器PID文件${NC}"
fi

if [ -f "$PROJECT_ROOT/.client.pid" ]; then
    CLIENT_PID=$(cat "$PROJECT_ROOT/.client.pid")
    if ps -p $CLIENT_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止前端应用 (PID: $CLIENT_PID)...${NC}"
        kill $CLIENT_PID 2>/dev/null
        echo -e "${GREEN}✅ 前端应用已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  前端应用进程不存在${NC}"
    fi
    rm -f "$PROJECT_ROOT/.client.pid"
else
    echo -e "${YELLOW}⚠️  未找到前端应用PID文件${NC}"
fi

# 额外检查端口占用并清理
echo ""
echo -e "${YELLOW}检查端口占用...${NC}"

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    PID=$(lsof -t -i:3001)
    echo -e "${YELLOW}发现端口3001被占用 (PID: $PID)，正在关闭...${NC}"
    kill $PID 2>/dev/null
    echo -e "${GREEN}✅ 端口3001已释放${NC}"
else
    echo -e "${GREEN}✅ 端口3001未被占用${NC}"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    PID=$(lsof -t -i:3000)
    echo -e "${YELLOW}发现端口3000被占用 (PID: $PID)，正在关闭...${NC}"
    kill $PID 2>/dev/null
    echo -e "${GREEN}✅ 端口3000已释放${NC}"
else
    echo -e "${GREEN}✅ 端口3000未被占用${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 所有服务已成功停止${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 重新启动系统:${NC}"
echo -e "   ${CYAN}./scripts/start-system.sh${NC}"
echo ""

