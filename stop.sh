#!/bin/bash

# 安全聊天系统停止入口
# 此脚本会调用 scripts 目录下的停止脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 调用实际的停止脚本
"$SCRIPT_DIR/scripts/stop-system.sh"

