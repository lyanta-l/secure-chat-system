#!/bin/bash

#####################################################################
# 安全聊天系统 - 环境诊断脚本
# 用于快速检查部署环境是否满足要求
#####################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔍 安全聊天系统 - 环境诊断工具${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 系统信息
echo -e "${BLUE}📊 系统信息${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo -e "操作系统: ${GREEN}$PRETTY_NAME${NC}"
else
    echo -e "操作系统: ${RED}无法识别${NC}"
fi
echo -e "内核版本: ${GREEN}$(uname -r)${NC}"
echo -e "架构: ${GREEN}$(uname -m)${NC}"
echo ""

# Node.js 环境
echo -e "${BLUE}🟢 Node.js 环境${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if command -v node &> /dev/null; then
    node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -ge 22 ]; then
        echo -e "✅ Node.js: ${GREEN}$(node --version)${NC} (符合要求)"
    else
        echo -e "⚠️  Node.js: ${YELLOW}$(node --version)${NC} (建议 v22+)"
    fi
else
    echo -e "❌ Node.js: ${RED}未安装${NC}"
fi

if command -v npm &> /dev/null; then
    echo -e "✅ npm: ${GREEN}v$(npm --version)${NC}"
else
    echo -e "❌ npm: ${RED}未安装${NC}"
fi
echo ""

# Python 环境
echo -e "${BLUE}🐍 Python 环境${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if command -v python3 &> /dev/null; then
    echo -e "✅ Python3: ${GREEN}$(python3 --version)${NC}"
else
    echo -e "❌ Python3: ${RED}未安装${NC}"
fi
echo ""

# 构建工具
echo -e "${BLUE}🔧 构建工具${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_tool() {
    if command -v "$1" &> /dev/null; then
        echo -e "✅ $1: ${GREEN}已安装${NC}"
    else
        echo -e "❌ $1: ${RED}未安装${NC}"
    fi
}

check_tool "gcc"
check_tool "g++"
check_tool "make"
check_tool "git"
check_tool "curl"
check_tool "lsof"
echo ""

# 项目依赖
echo -e "${BLUE}📦 项目依赖${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ -d "$PROJECT_ROOT/server/node_modules" ]; then
    echo -e "✅ 后端依赖: ${GREEN}已安装${NC}"
    
    # 检查关键包
    if [ -d "$PROJECT_ROOT/server/node_modules/bcrypt" ]; then
        echo -e "   ✅ bcrypt: ${GREEN}已安装${NC}"
    else
        echo -e "   ❌ bcrypt: ${RED}未安装${NC}"
    fi
    
    if [ -d "$PROJECT_ROOT/server/node_modules/sqlite3" ]; then
        echo -e "   ✅ sqlite3: ${GREEN}已安装${NC}"
    else
        echo -e "   ❌ sqlite3: ${RED}未安装${NC}"
    fi
    
    if [ -d "$PROJECT_ROOT/server/node_modules/ws" ]; then
        echo -e "   ✅ ws: ${GREEN}已安装${NC}"
    else
        echo -e "   ❌ ws: ${RED}未安装${NC}"
    fi
else
    echo -e "❌ 后端依赖: ${RED}未安装${NC}"
fi

if [ -d "$PROJECT_ROOT/client/node_modules" ]; then
    echo -e "✅ 前端依赖: ${GREEN}已安装${NC}"
    
    if [ -d "$PROJECT_ROOT/client/node_modules/react" ]; then
        echo -e "   ✅ react: ${GREEN}已安装${NC}"
    else
        echo -e "   ❌ react: ${RED}未安装${NC}"
    fi
else
    echo -e "❌ 前端依赖: ${RED}未安装${NC}"
fi
echo ""

# 端口检查
echo -e "${BLUE}🔌 端口状态${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
check_port() {
    local port=$1
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local pid=$(lsof -t -i:$port)
            local process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo -e "⚠️  端口 $port: ${YELLOW}已被占用${NC} (PID: $pid, 进程: $process)"
        else
            echo -e "✅ 端口 $port: ${GREEN}可用${NC}"
        fi
    else
        echo -e "⚠️  端口 $port: ${YELLOW}无法检查 (lsof 未安装)${NC}"
    fi
}

check_port 3000
check_port 3001
echo ""

# 文件权限
echo -e "${BLUE}🔐 文件权限${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_executable() {
    if [ -x "$1" ]; then
        echo -e "✅ $(basename $1): ${GREEN}可执行${NC}"
    elif [ -f "$1" ]; then
        echo -e "⚠️  $(basename $1): ${YELLOW}存在但不可执行${NC}"
    else
        echo -e "❌ $(basename $1): ${RED}不存在${NC}"
    fi
}

check_executable "$PROJECT_ROOT/start.sh"
check_executable "$PROJECT_ROOT/stop.sh"
check_executable "$PROJECT_ROOT/scripts/start-system.sh"
check_executable "$PROJECT_ROOT/scripts/stop-system.sh"
echo ""

# 磁盘空间
echo -e "${BLUE}💾 磁盘空间${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
available_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$available_space" -ge 2 ]; then
    echo -e "✅ 可用空间: ${GREEN}${available_space}GB${NC}"
else
    echo -e "⚠️  可用空间: ${YELLOW}${available_space}GB${NC} (建议至少 2GB)"
fi
echo ""

# 网络连接
echo -e "${BLUE}🌐 网络连接${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if ping -c 1 google.com &> /dev/null || ping -c 1 baidu.com &> /dev/null; then
    echo -e "✅ 网络连接: ${GREEN}正常${NC}"
else
    echo -e "❌ 网络连接: ${RED}无法连接到互联网${NC}"
fi
echo ""

# 数据库检查
echo -e "${BLUE}🗄️  数据库${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ -f "$PROJECT_ROOT/server/database.db" ]; then
    db_size=$(du -h "$PROJECT_ROOT/server/database.db" | cut -f1)
    echo -e "✅ 数据库文件: ${GREEN}存在${NC} (大小: $db_size)"
else
    echo -e "ℹ️  数据库文件: ${BLUE}未创建${NC} (首次运行时会自动创建)"
fi
echo ""

# 总结
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 诊断总结${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 计算就绪状态
ready=true

if ! command -v node &> /dev/null; then
    ready=false
fi

if ! command -v npm &> /dev/null; then
    ready=false
fi

if [ ! -d "$PROJECT_ROOT/server/node_modules" ] || [ ! -d "$PROJECT_ROOT/client/node_modules" ]; then
    ready=false
fi

if [ "$ready" = true ]; then
    echo -e "${GREEN}🎉 系统已就绪，可以启动！${NC}"
    echo -e "${CYAN}运行命令: ${GREEN}./start.sh${NC}"
else
    echo -e "${YELLOW}⚠️  系统未完全就绪${NC}"
    echo -e "${CYAN}建议运行: ${GREEN}./setup-ubuntu.sh${NC}"
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

