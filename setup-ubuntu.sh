#!/bin/bash

#####################################################################
# 安全聊天系统 - Ubuntu 自动化部署脚本
# 适用于：Ubuntu 20.04+ / Debian 11+
# 功能：自动安装所有依赖、配置环境、部署项目
#####################################################################

set -e  # 遇到错误立即停止

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/setup.log"

# 日志函数
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# 错误处理函数
error_exit() {
    log "${RED}❌ 错误: $1${NC}"
    log "${YELLOW}详细日志已保存到: $LOG_FILE${NC}"
    exit 1
}

# 检查是否为 root 用户
check_not_root() {
    if [ "$EUID" -eq 0 ]; then
        error_exit "请不要使用 root 用户运行此脚本！使用普通用户运行即可。"
    fi
}

# 打印欢迎信息
print_banner() {
    clear
    log "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${CYAN}    🔒 安全聊天系统 - Ubuntu 自动化部署脚本 🔒${NC}"
    log "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log ""
    log "${YELLOW}本脚本将自动完成以下操作：${NC}"
    log "  1. 检查并更新系统"
    log "  2. 安装构建工具（gcc, g++, make, python3）"
    log "  3. 安装 Node.js 22.x"
    log "  4. 安装项目依赖（server + client）"
    log "  5. 配置文件权限"
    log "  6. 验证部署结果"
    log ""
    log "${YELLOW}预计耗时：5-10 分钟（取决于网络速度）${NC}"
    log "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log ""
}

# 检查系统要求
check_system() {
    log "${BLUE}[1/7]${NC} 检查系统环境..."
    
    # 检查操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        log "${GREEN}✅ 操作系统: $PRETTY_NAME${NC}"
    else
        error_exit "无法识别的操作系统"
    fi
    
    # 检查网络连接
    if ! ping -c 1 google.com &> /dev/null && ! ping -c 1 baidu.com &> /dev/null; then
        error_exit "无法连接到互联网，请检查网络设置"
    fi
    log "${GREEN}✅ 网络连接正常${NC}"
    
    # 检查磁盘空间（至少需要 2GB）
    available_space=$(df -BG "$SCRIPT_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 2 ]; then
        log "${YELLOW}⚠️  磁盘空间较少（剩余 ${available_space}GB），建议至少 2GB${NC}"
    else
        log "${GREEN}✅ 磁盘空间充足（剩余 ${available_space}GB）${NC}"
    fi
    
    log ""
}

# 更新系统包
update_system() {
    log "${BLUE}[2/7]${NC} 更新系统包列表..."
    
    if ! sudo apt update >> "$LOG_FILE" 2>&1; then
        error_exit "系统更新失败，请检查网络或 apt 源配置"
    fi
    
    log "${GREEN}✅ 系统包列表更新完成${NC}"
    log ""
}

# 安装构建工具
install_build_tools() {
    log "${BLUE}[3/7]${NC} 安装构建工具..."
    
    local packages=(
        "build-essential"
        "g++"
        "make"
        "python3"
        "python3-pip"
        "git"
        "curl"
        "lsof"
        "libsqlite3-dev"
    )
    
    local to_install=()
    
    for pkg in "${packages[@]}"; do
        if ! dpkg -l | grep -q "^ii  $pkg"; then
            to_install+=("$pkg")
        fi
    done
    
    if [ ${#to_install[@]} -eq 0 ]; then
        log "${GREEN}✅ 所有构建工具已安装${NC}"
    else
        log "${YELLOW}⚙️  正在安装: ${to_install[*]}${NC}"
        if ! sudo DEBIAN_FRONTEND=noninteractive apt install -y "${to_install[@]}" >> "$LOG_FILE" 2>&1; then
            error_exit "构建工具安装失败"
        fi
        log "${GREEN}✅ 构建工具安装完成${NC}"
    fi
    
    # 验证关键工具
    for tool in gcc g++ make python3; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "$tool 未正确安装"
        fi
    done
    
    log "${GREEN}   • gcc: $(gcc --version | head -n1)${NC}"
    log "${GREEN}   • g++: $(g++ --version | head -n1)${NC}"
    log "${GREEN}   • make: $(make --version | head -n1)${NC}"
    log "${GREEN}   • python3: $(python3 --version)${NC}"
    log ""
}

# 安装 Node.js
install_nodejs() {
    log "${BLUE}[4/7]${NC} 检查 Node.js..."
    
    local required_version=22
    local current_version=0
    
    if command -v node &> /dev/null; then
        current_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        log "${CYAN}   当前 Node.js 版本: v$(node -v | cut -d'v' -f2)${NC}"
    fi
    
    if [ "$current_version" -lt "$required_version" ]; then
        log "${YELLOW}⚙️  正在安装 Node.js ${required_version}.x...${NC}"
        log "${YELLOW}   （这可能需要几分钟，请耐心等待）${NC}"
        
        # 下载并执行 NodeSource 安装脚本
        if ! curl -fsSL https://deb.nodesource.com/setup_${required_version}.x | sudo -E bash - >> "$LOG_FILE" 2>&1; then
            error_exit "Node.js 源配置失败"
        fi
        
        # 安装 Node.js
        if ! sudo DEBIAN_FRONTEND=noninteractive apt install -y nodejs >> "$LOG_FILE" 2>&1; then
            error_exit "Node.js 安装失败"
        fi
        
        log "${GREEN}✅ Node.js 安装完成${NC}"
    else
        log "${GREEN}✅ Node.js 版本符合要求${NC}"
    fi
    
    # 验证安装
    if ! command -v node &> /dev/null; then
        error_exit "Node.js 安装验证失败"
    fi
    
    if ! command -v npm &> /dev/null; then
        error_exit "npm 安装验证失败"
    fi
    
    log "${GREEN}   • Node.js: $(node --version)${NC}"
    log "${GREEN}   • npm: v$(npm --version)${NC}"
    
    # 配置 npm 使用 Python3
    npm config set python python3 2>> "$LOG_FILE" || true
    
    log ""
}

# 安装项目依赖
install_dependencies() {
    log "${BLUE}[5/7]${NC} 安装项目依赖..."
    
    # 安装后端依赖
    log "${CYAN}   📦 安装后端依赖...${NC}"
    cd "$SCRIPT_DIR/server"
    
    if [ ! -f "package.json" ]; then
        error_exit "未找到 server/package.json，请确保在项目根目录运行此脚本"
    fi
    
    # 清理旧的安装（如果存在问题）
    if [ -d "node_modules" ] && [ -f ".install_failed" ]; then
        log "${YELLOW}   检测到之前的安装失败，正在清理...${NC}"
        rm -rf node_modules package-lock.json
    fi
    
    # 尝试安装
    if ! npm install >> "$LOG_FILE" 2>&1; then
        touch .install_failed
        log "${RED}   后端依赖安装失败，尝试重新编译原生模块...${NC}"
        
        # 尝试重新编译 bcrypt 和 sqlite3
        if ! npm rebuild bcrypt --build-from-source >> "$LOG_FILE" 2>&1; then
            log "${YELLOW}   bcrypt 编译失败，尝试降级版本...${NC}"
            npm install bcrypt@5.1.1 --save >> "$LOG_FILE" 2>&1 || error_exit "bcrypt 安装失败"
        fi
        
        if ! npm rebuild sqlite3 --build-from-source >> "$LOG_FILE" 2>&1; then
            error_exit "sqlite3 编译失败"
        fi
        
        # 再次尝试完整安装
        if ! npm install >> "$LOG_FILE" 2>&1; then
            error_exit "后端依赖安装失败，请查看日志文件"
        fi
    fi
    
    rm -f .install_failed
    log "${GREEN}   ✅ 后端依赖安装完成${NC}"
    
    # 安装前端依赖
    log "${CYAN}   🎨 安装前端依赖...${NC}"
    cd "$SCRIPT_DIR/client"
    
    if [ ! -f "package.json" ]; then
        error_exit "未找到 client/package.json"
    fi
    
    # React 19 可能需要 --legacy-peer-deps
    if ! npm install --legacy-peer-deps >> "$LOG_FILE" 2>&1; then
        log "${YELLOW}   尝试不使用 legacy-peer-deps...${NC}"
        if ! npm install >> "$LOG_FILE" 2>&1; then
            error_exit "前端依赖安装失败"
        fi
    fi
    
    log "${GREEN}   ✅ 前端依赖安装完成${NC}"
    
    cd "$SCRIPT_DIR"
    log ""
}

# 配置文件权限
configure_permissions() {
    log "${BLUE}[6/7]${NC} 配置文件权限..."
    
    # 给启动脚本添加执行权限
    chmod +x "$SCRIPT_DIR/start.sh" 2>> "$LOG_FILE" || true
    chmod +x "$SCRIPT_DIR/stop.sh" 2>> "$LOG_FILE" || true
    chmod +x "$SCRIPT_DIR/scripts/"*.sh 2>> "$LOG_FILE" || true
    
    # 确保项目目录有正确权限
    if [ -O "$SCRIPT_DIR" ]; then
        log "${GREEN}✅ 文件权限配置完成${NC}"
    else
        log "${YELLOW}⚠️  项目目录所有者不是当前用户，可能需要手动调整权限${NC}"
    fi
    
    log ""
}

# 验证部署
verify_deployment() {
    log "${BLUE}[7/7]${NC} 验证部署结果..."
    
    local all_ok=true
    
    # 检查 Node.js
    if command -v node &> /dev/null; then
        log "${GREEN}✅ Node.js: $(node --version)${NC}"
    else
        log "${RED}❌ Node.js 未安装${NC}"
        all_ok=false
    fi
    
    # 检查 npm
    if command -v npm &> /dev/null; then
        log "${GREEN}✅ npm: v$(npm --version)${NC}"
    else
        log "${RED}❌ npm 未安装${NC}"
        all_ok=false
    fi
    
    # 检查后端依赖
    if [ -d "$SCRIPT_DIR/server/node_modules" ]; then
        log "${GREEN}✅ 后端依赖已安装${NC}"
    else
        log "${RED}❌ 后端依赖未安装${NC}"
        all_ok=false
    fi
    
    # 检查前端依赖
    if [ -d "$SCRIPT_DIR/client/node_modules" ]; then
        log "${GREEN}✅ 前端依赖已安装${NC}"
    else
        log "${RED}❌ 前端依赖未安装${NC}"
        all_ok=false
    fi
    
    # 检查关键文件
    if [ -f "$SCRIPT_DIR/server/server.js" ]; then
        log "${GREEN}✅ 后端服务器文件存在${NC}"
    else
        log "${RED}❌ 后端服务器文件缺失${NC}"
        all_ok=false
    fi
    
    # 检查启动脚本
    if [ -x "$SCRIPT_DIR/start.sh" ]; then
        log "${GREEN}✅ 启动脚本可执行${NC}"
    else
        log "${RED}❌ 启动脚本不可执行${NC}"
        all_ok=false
    fi
    
    log ""
    
    if [ "$all_ok" = true ]; then
        log "${GREEN}🎉 所有检查通过！${NC}"
        return 0
    else
        log "${RED}⚠️  部分检查未通过，请查看上述错误信息${NC}"
        return 1
    fi
}

# 打印完成信息
print_completion() {
    log ""
    log "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${GREEN}🎊 部署完成！${NC}"
    log "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log ""
    log "${YELLOW}📌 下一步操作：${NC}"
    log ""
    log "${CYAN}1. 启动系统：${NC}"
    log "   ${GREEN}./start.sh${NC}"
    log ""
    log "${CYAN}2. 访问应用：${NC}"
    log "   前端: ${GREEN}http://localhost:3000${NC}"
    log "   后端: ${GREEN}http://localhost:3001${NC}"
    log ""
    log "${CYAN}3. 停止系统：${NC}"
    log "   ${GREEN}./stop.sh${NC}"
    log ""
    log "${CYAN}4. 运行测试：${NC}"
    log "   ${GREEN}node scripts/test-chat-system.js${NC}"
    log ""
    log "${YELLOW}💡 使用提示：${NC}"
    log "   • 首次使用建议清除浏览器 LocalStorage"
    log "   • 详细文档: ${CYAN}cat README.md${NC}"
    log "   • 使用指南: ${CYAN}cat docs/USAGE_GUIDE.md${NC}"
    log "   • 部署日志: ${CYAN}cat setup.log${NC}"
    log ""
    log "${YELLOW}🐛 遇到问题？${NC}"
    log "   1. 查看日志: ${CYAN}cat $LOG_FILE${NC}"
    log "   2. 运行诊断: ${CYAN}./scripts/diagnose.sh${NC} (如果存在)"
    log "   3. GitHub Issues: ${CYAN}https://github.com/lyanta-l/secure-chat-system/issues${NC}"
    log ""
    log "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log ""
}

#####################################################################
# 主函数
#####################################################################
main() {
    # 初始化日志文件
    echo "部署开始时间: $(date)" > "$LOG_FILE"
    
    # 检查不是 root 用户
    check_not_root
    
    # 打印欢迎信息
    print_banner
    
    # 询问用户确认
    read -p "是否继续？[Y/n] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ -n $REPLY ]]; then
        log "${YELLOW}部署已取消${NC}"
        exit 0
    fi
    
    log ""
    log "${CYAN}开始部署...${NC}"
    log ""
    
    # 执行部署步骤
    check_system
    update_system
    install_build_tools
    install_nodejs
    install_dependencies
    configure_permissions
    
    # 验证部署
    if verify_deployment; then
        print_completion
        exit 0
    else
        log ""
        log "${YELLOW}部署完成但存在一些警告，请查看上述信息${NC}"
        log "${YELLOW}详细日志: $LOG_FILE${NC}"
        exit 1
    fi
}

# 捕获错误
trap 'error_exit "脚本执行被中断"' INT TERM

# 运行主函数
main

