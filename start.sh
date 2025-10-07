#!/bin/bash

# 安全聊天系统启动入口
# 此脚本会调用 scripts 目录下的启动脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 调用实际的启动脚本
"$SCRIPT_DIR/scripts/start-system.sh"
