# 快速开始 - 创建 GitHub 仓库

## 最简单的方式

### 1. 在浏览器中创建仓库

访问：https://github.com/new

填写信息：
- **Repository name**: `scanner-open`
- **Description**: `Open-source privacy scanner for Android, iOS, and Web applications`
- **Visibility**: Public ✅
- **不要勾选** "Add a README file"
- **不要勾选** "Add .gitignore"
- **不要勾选** "Choose a license"

点击 **"Create repository"**

### 2. 复制仓库 URL

创建成功后，GitHub 会显示类似这样的命令：

```
…or push an existing repository from the command line
git remote add origin https://github.com/YOUR_USERNAME/scanner-open.git
git branch -M main
git push -u origin main
```

### 3. 在 PowerShell 中执行

打开 PowerShell，进入项目目录：

```powershell
cd C:\Users\祝融\Desktop\context\scanner-open

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/scanner-open.git

# 重命名分支为 main（如果需要）
git branch -M main

# 推送代码
git push -u origin main
```

### 4. 完成！

访问 `https://github.com/YOUR_USERNAME/scanner-open` 查看您的仓库。

---

## 或者使用自动化脚本

如果您有 GitHub Personal Access Token，可以运行：

```bash
cd scanner-open
node create-github-repo.js
```

脚本会引导您完成整个过程。

