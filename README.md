# Privacy Scanner

开源隐私扫描工具，用于扫描 Android、iOS 和 Web 应用中的隐私相关功能。

## 功能特性

- 🔍 **多平台支持**：支持 Android、iOS 和 Web 应用扫描
- 📋 **权限检测**：自动识别应用请求的权限
- 🔗 **第三方服务**：检测第三方 SDK 和服务
- 📊 **数据分析**：分析数据收集和存储行为
- 📈 **风险评估**：提供隐私风险评估和建议

## 快速开始

### 安装

```bash
npm install
```

### 使用 CLI

```bash
# 扫描项目
node packages/scanner-cli/bin/scanner.js scan ./my-project

# 指定输出文件
node packages/scanner-cli/bin/scanner.js scan ./my-project --output=./result.json

# 输出文本格式
node packages/scanner-cli/bin/scanner.js scan ./my-project --output=./result.txt --format=text
```

### 使用 Node.js API

```javascript
const { ScannerManager } = require('@scanner-open/core');

const scanner = new ScannerManager();

// 扫描项目
const result = await scanner.scanProject('./my-project', {
  includePatterns: ['**/*.{js,java,swift}'],
  excludePatterns: ['**/node_modules/**']
});

console.log('扫描结果:', result);
```

## 项目结构

```
scanner-open/
├── packages/
│   ├── scanner-core/      # 核心扫描引擎
│   └── scanner-cli/       # 命令行工具
├── examples/              # 示例项目
│   ├── android-app/
│   ├── ios-app/
│   └── web-app/
├── docs/                  # 文档
└── .github/               # GitHub 配置
```

## 支持的扫描类型

### Android
- 权限检测（Camera、Location、Contacts 等）
- API 使用分析
- 第三方库识别（Firebase、Google Play Services 等）
- Gradle 依赖分析

### iOS
- 权限说明检测
- API 使用分析
- 第三方库识别（Firebase、Analytics 等）
- Info.plist 配置分析

### Web
- Web API 使用（Geolocation、Camera、Microphone 等）
- 存储技术检测（LocalStorage、IndexedDB 等）
- 跟踪服务识别（Google Analytics、Facebook Pixel 等）
- 第三方服务检测

## 示例项目

查看 `examples/` 目录下的示例项目，了解如何在不同平台上使用扫描器。

## 文档

- [快速开始指南](docs/QUICK_START.md)
- [API 文档](docs/API.md)
- [贡献指南](CONTRIBUTING.md)

## 许可证

MIT License

## 贡献

欢迎贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目。

## 许可证兼容性

本项目使用 MIT 许可证，所有依赖库均兼容开源使用。

