#!/bin/bash

set -e

# 配置变量
PROJECT_DIR="/home/xiaohui/app"
REPO_URL="https://github.com/xiaohuibuhuifei/dnfm-tools.git"
BRANCH="main"

echo "🚀 开始部署..."

# 如果项目目录不存在，则克隆仓库
if [ ! -d "$PROJECT_DIR/.git" ]; then
    echo "📦 首次部署，克隆仓库..."
    # 备份现有文件
    if [ -d "$PROJECT_DIR" ] && [ "$(ls -A $PROJECT_DIR 2>/dev/null)" ]; then
        mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%s)"
    fi
    mkdir -p "$PROJECT_DIR"
    git clone "$REPO_URL" "$PROJECT_DIR"
else
    echo "📥 拉取最新代码..."
    cd "$PROJECT_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
fi

# 停止并删除旧容器
echo "🛑 停止旧容器..."
cd "$PROJECT_DIR"
docker-compose down 2>/dev/null || true

# 构建并启动新容器
echo "🔨 构建并启动新容器..."
docker-compose up -d --build

# 清理未使用的 Docker 镜像
echo "🧹 清理旧镜像..."
docker image prune -f

echo "✅ 部署完成！"
echo "🌐 访问地址: http://$(hostname -I | awk '{print $1}'):9001"
