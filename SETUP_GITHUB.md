# GitHub 仓库设置指南

## 方法 1: 使用自动化脚本（推荐）

### 步骤 1: 获取 GitHub Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 输入 token 名称，例如：`scanner-open-setup`
4. **重要**: 勾选 `repo` 权限（完整仓库访问权限）
5. 点击 "Generate token"
6. **复制 token**（只显示一次）

### 步骤 2: 运行交互式脚本

```bash
cd scanner-open
node create-github-repo.js
```

脚本会提示您输入：
- 仓库名称（默认: scanner-open）
- 仓库描述
- 是否私有
- GitHub Token
- GitHub 用户名

脚本会自动：
1. 创建 GitHub 仓库
2. 配置 git remote
3. 推送代码到 GitHub

## 方法 2: 手动创建（更简单）

### 步骤 1: 在 GitHub 上创建仓库

1. 访问 https://github.com/new
2. 仓库名称: `scanner-open`
3. 描述: `Open-source privacy scanner for Android, iOS, and Web applications`
4. 选择 **Public**
5. **不要**勾选任何初始化选项（README、.gitignore、LICENSE）
6. 点击 "Create repository"

### 步骤 2: 推送代码

在 `scanner-open` 目录下执行：

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为您的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/scanner-open.git

# 如果已存在 origin，先删除再添加
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/scanner-open.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

## 方法 3: 使用 GitHub CLI（如果已安装）

```bash
# 安装 GitHub CLI (如果未安装)
# Windows: winget install GitHub.cli

# 登录
gh auth login

# 创建仓库并推送
cd scanner-open
gh repo create scanner-open --public --source=. --remote=origin --push
```

## 验证

推送成功后，访问 `https://github.com/YOUR_USERNAME/scanner-open` 查看仓库。

## 下一步

- [ ] 检查仓库设置
- [ ] 启用 Issues 和 Discussions
- [ ] 添加仓库描述和标签
- [ ] 创建第一个 Release (v0.1.0)

