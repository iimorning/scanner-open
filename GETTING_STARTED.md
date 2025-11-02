# 快速开始指南

## ✅ 已完成的工作

1. **代码拆分与整理**
   - ✅ 复制了所有扫描器核心代码（Android、iOS、Web）
   - ✅ 创建了独立的 ScannerManager（移除对 BaseService 的依赖）
   - ✅ 移除了所有内部依赖（日志、配置管理等）

2. **CLI 工具**
   - ✅ 创建了命令行工具 (`packages/scanner-cli`)
   - ✅ 支持扫描项目并输出结果（JSON/Text 格式）

3. **示例项目**
   - ✅ Android 示例
   - ✅ iOS 示例
   - ✅ Web 示例

4. **测试**
   - ✅ 迁移了基础测试文件
   - ✅ 测试覆盖核心扫描器功能

5. **文档**
   - ✅ README.md
   - ✅ CONTRIBUTING.md
   - ✅ CHANGELOG.md
   - ✅ LICENSE (MIT)

6. **自动化**
   - ✅ GitHub Actions CI 配置

## 📋 下一步操作

### 1. 在 GitHub 上创建仓库

```bash
# 在 GitHub 上创建一个新仓库，然后：
git remote add origin https://github.com/your-org/scanner-open.git
git branch -M main
git push -u origin main
```

### 2. 安装依赖并测试

```bash
cd scanner-open
npm install
npm test
```

### 3. 验证 CLI 工具

```bash
# 测试扫描示例项目
node packages/scanner-cli/bin/scanner.js scan examples/web-app

# 输出到文件
node packages/scanner-cli/bin/scanner.js scan examples/web-app --output=./result.json
```

### 4. 发布到 npm（可选）

```bash
cd packages/scanner-core
npm publish --access public

cd ../scanner-cli
npm publish --access public
```

### 5. 配置 GitHub Actions Secrets（如果需要）

在 GitHub 仓库设置中添加必要的 secrets（如 npm token）。

## 🎯 仓库结构

```
scanner-open/
├── packages/
│   ├── scanner-core/      # 核心扫描引擎
│   │   ├── src/
│   │   │   ├── scanners/  # 扫描器实现
│   │   │   ├── scanner-manager.js
│   │   │   └── index.js
│   │   └── test/          # 测试文件
│   └── scanner-cli/       # 命令行工具
│       ├── bin/
│       └── src/
├── examples/              # 示例项目
│   ├── android-app/
│   ├── ios-app/
│   └── web-app/
├── docs/                  # 文档
├── .github/
│   └── workflows/         # CI 配置
└── README.md
```

## 📝 使用示例

### 使用 Node.js API

```javascript
const { ScannerManager } = require('@scanner-open/core');

const scanner = new ScannerManager();

const result = await scanner.scanProject('./my-project', {
  includePatterns: ['**/*.{js,java,swift}'],
  excludePatterns: ['**/node_modules/**']
});

console.log('扫描结果:', result);
```

### 使用 CLI

```bash
# 基本扫描
node packages/scanner-cli/bin/scanner.js scan ./my-project

# 指定输出格式
node packages/scanner-cli/bin/scanner.js scan ./my-project --output=result.json --format=json

# 强制重新扫描
node packages/scanner-cli/bin/scanner.js scan ./my-project --force
```

## 🔧 开发指南

### 添加新的扫描器

1. 在 `packages/scanner-core/src/scanners/` 创建新扫描器
2. 继承 `BaseScanner` 类
3. 在 `ScannerManager` 中注册

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定包的测试
cd packages/scanner-core
npm test
```

## 📚 更多信息

- 查看 [README.md](README.md) 了解项目概述
- 查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何贡献代码
- 查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新

