#!/usr/bin/env node

const path = require('path');
const ScannerManager = require(path.join(__dirname, '../../scanner-core/src/scanner-manager'));
const fs = require('fs').promises;

/**
 * CLI 命令行工具
 */
class CLI {
    constructor() {
        this.scannerManager = new ScannerManager({
            enableParallelScanning: true,
            maxConcurrentScans: 3,
            logger: {
                debug: (...args) => {
                    if (process.env.DEBUG) {
                        console.log('[DEBUG]', ...args);
                    }
                },
                info: console.log,
                warn: console.warn,
                error: console.error
            }
        });
    }

    /**
     * 运行 CLI
     */
    async run() {
        const args = process.argv.slice(2);

        if (args.length === 0) {
            this.showHelp();
            process.exit(0);
        }

        const command = args[0];

        switch (command) {
            case 'scan':
                await this.scanCommand(args.slice(1));
                break;
            case '--help':
            case '-h':
            case 'help':
                this.showHelp();
                break;
            case '--version':
            case '-v':
                this.showVersion();
                break;
            default:
                console.error(`未知命令: ${command}`);
                this.showHelp();
                process.exit(1);
        }
    }

    /**
     * 扫描命令
     */
    async scanCommand(args) {
        if (args.length === 0) {
            console.error('请指定要扫描的项目路径');
            process.exit(1);
        }

        const projectPath = path.resolve(args[0]);
        const outputPath = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
        const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'json';
        const forceRescan = args.includes('--force');

        try {
            // 检查项目路径是否存在
            const stats = await fs.stat(projectPath);
            if (!stats.isDirectory()) {
                console.error(`错误: ${projectPath} 不是一个目录`);
                process.exit(1);
            }

            console.log(`\n🔍 开始扫描项目: ${projectPath}\n`);

            // 执行扫描
            const result = await this.scannerManager.scanProject(projectPath, {
                forceRescan,
                includePatterns: ['**/*.{js,ts,jsx,tsx,java,kt,swift,m,xml,json,plist,html,css}'],
                excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
            });

            // 显示结果摘要
            this.displaySummary(result);

            // 输出结果到文件
            if (outputPath) {
                await this.saveResult(result, outputPath, format);
                console.log(`\n✅ 扫描结果已保存到: ${outputPath}`);
            } else {
                // 如果没有指定输出文件，以 JSON 格式输出到控制台
                console.log('\n📄 扫描结果:');
                console.log(JSON.stringify(result, null, 2));
            }

        } catch (error) {
            console.error(`\n❌ 扫描失败: ${error.message}`);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * 显示结果摘要
     */
    displaySummary(result) {
        console.log('\n📊 扫描摘要:');
        console.log(`   文件扫描数: ${result.filesScanned || 0}`);
        console.log(`   总文件数: ${result.totalFiles || 0}`);
        console.log(`   扫描耗时: ${(result.duration || 0) / 1000}秒`);
        
        if (result.permissions && result.permissions.length > 0) {
            console.log(`   检测到权限: ${result.permissions.length}个`);
        }
        
        if (result.thirdPartyServices && result.thirdPartyServices.length > 0) {
            console.log(`   第三方服务: ${result.thirdPartyServices.length}个`);
        }

        if (result.summary) {
            console.log(`\n   隐私风险等级: ${result.summary.privacyRiskLevel}`);
            if (result.summary.mainFeatures && result.summary.mainFeatures.length > 0) {
                console.log(`   主要功能: ${result.summary.mainFeatures.join(', ')}`);
            }
        }
    }

    /**
     * 保存结果到文件
     */
    async saveResult(result, outputPath, format) {
        const outputDir = path.dirname(outputPath);
        if (outputDir !== '.') {
            await fs.mkdir(outputDir, { recursive: true });
        }

        let content;
        switch (format.toLowerCase()) {
            case 'json':
                content = JSON.stringify(result, null, 2);
                break;
            case 'txt':
            case 'text':
                content = this.formatAsText(result);
                break;
            default:
                throw new Error(`不支持的输出格式: ${format}`);
        }

        await fs.writeFile(outputPath, content, 'utf8');
    }

    /**
     * 将结果格式化为文本
     */
    formatAsText(result) {
        const lines = [];
        
        lines.push('扫描结果摘要');
        lines.push('='.repeat(50));
        lines.push(`项目路径: ${result.projectPath}`);
        lines.push(`扫描时间: ${result.timestamp}`);
        lines.push(`文件扫描数: ${result.filesScanned || 0}`);
        lines.push(`总文件数: ${result.totalFiles || 0}`);
        lines.push(`扫描耗时: ${(result.duration || 0) / 1000}秒`);
        lines.push('');

        if (result.permissions && result.permissions.length > 0) {
            lines.push('检测到的权限:');
            result.permissions.forEach(p => lines.push(`  - ${p}`));
            lines.push('');
        }

        if (result.thirdPartyServices && result.thirdPartyServices.length > 0) {
            lines.push('第三方服务:');
            result.thirdPartyServices.forEach(s => lines.push(`  - ${s}`));
            lines.push('');
        }

        if (result.summary) {
            lines.push('隐私风险评估:');
            lines.push(`  风险等级: ${result.summary.privacyRiskLevel}`);
            if (result.summary.complianceHints && result.summary.complianceHints.length > 0) {
                lines.push('  合规建议:');
                result.summary.complianceHints.forEach(h => lines.push(`    - ${h}`));
            }
        }

        return lines.join('\n');
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log(`
隐私扫描工具 (Privacy Scanner)

用法:
  scanner scan <项目路径> [选项]

选项:
  --output=<路径>      指定输出文件路径
  --format=<格式>      指定输出格式 (json, text) 默认: json
  --force              强制重新扫描，忽略缓存
  --help, -h           显示帮助信息
  --version, -v        显示版本信息

示例:
  scanner scan ./my-app
  scanner scan ./my-app --output=./scan-result.json
  scanner scan ./my-app --output=./scan-result.txt --format=text
  scanner scan ./my-app --force
        `);
    }

    /**
     * 显示版本信息
     */
    showVersion() {
        const packageJson = require('../package.json');
        console.log(`scanner-cli v${packageJson.version}`);
    }
}

// 运行 CLI
if (require.main === module) {
    const cli = new CLI();
    cli.run().catch(error => {
        console.error('致命错误:', error);
        process.exit(1);
    });
}

module.exports = CLI;

