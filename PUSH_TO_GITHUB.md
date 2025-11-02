# 🚀 推送到 GitHub - 最简单的方法

## 方式一：在浏览器创建（推荐，最简单）

### 步骤：

1. **打开浏览器，访问**: https://github.com/new

2. **填写仓库信息**:
   - Repository name: `scanner-open`
   - Description: `Open-source privacy scanner for Android, iOS, and Web applications`
   - ✅ 选择 **Public**
   - ❌ **不要勾选** "Add a README file"
   - ❌ **不要勾选** "Add .gitignore"  
   - ❌ **不要勾选** "Choose a license"

3. **点击 "Create repository"**

4. **复制显示的仓库 URL**（类似：`https://github.com/YOUR_USERNAME/scanner-open.git`）

5. **在 PowerShell 中执行**（替换 YOUR_USERNAME）：

```powershell
cd C:\Users\祝融\Desktop\context\scanner-open

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/scanner-open.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

## 方式二：使用自动化脚本

如果您有 GitHub Personal Access Token：

1. **获取 Token**: 
   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 勾选 `repo` 权限
   - 复制生成的 token

2. **运行脚本**:
```powershell
cd C:\Users\祝融\Desktop\context\scanner-open
node create-github-repo.js
```

脚本会引导您完成整个过程！

## 完成后

访问 `https://github.com/YOUR_USERNAME/scanner-open` 查看您的仓库。

---

**提示**: 如果您告诉我您的 GitHub 用户名，我可以帮您生成完整的命令！😊

