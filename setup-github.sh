#!/bin/bash

# GitHub 仓库设置脚本
# 使用方法: 
#   export GITHUB_TOKEN="your_token"
#   export GITHUB_USERNAME="your_username"
#   bash setup-github.sh

REPO_NAME="scanner-open"
DESCRIPTION="Open-source privacy scanner for Android, iOS, and Web applications"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 请设置 GITHUB_TOKEN 环境变量"
    echo "   export GITHUB_TOKEN='your_token'"
    exit 1
fi

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ 请设置 GITHUB_USERNAME 环境变量"
    echo "   export GITHUB_USERNAME='your_username'"
    exit 1
fi

echo "🚀 正在创建 GitHub 仓库..."

# 创建仓库
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"$DESCRIPTION\",\"private\":false}")

HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ 仓库创建成功"
    
    # 配置 git remote
    git remote remove origin 2>/dev/null
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    git branch -M main
    git push -u origin main
    
    echo "✅ 代码已推送到 GitHub"
    echo "📍 仓库地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
else
    echo "❌ 创建仓库失败"
    echo "$BODY"
    exit 1
fi

