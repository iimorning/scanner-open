// 简单的 CLI 测试脚本
const ScannerManager = require('./packages/scanner-core/src/scanner-manager');
const path = require('path');
const fs = require('fs').promises;

async function testScan() {
    console.log('开始测试扫描功能...\n');
    
    try {
        const scanner = new ScannerManager({
            logger: {
                debug: () => {},
                info: (...args) => console.log(...args),
                warn: (...args) => console.warn(...args),
                error: (...args) => console.error(...args)
            }
        });

        const examplePath = path.join(__dirname, 'examples', 'web-app');
        console.log(`扫描路径: ${examplePath}\n`);

        const result = await scanner.scanProject(examplePath, {
            includePatterns: ['**/*.{js,html}'],
            excludePatterns: ['**/node_modules/**']
        });

        console.log('\n✅ 扫描完成！');
        console.log('\n📊 扫描结果摘要:');
        console.log(`   文件扫描数: ${result.filesScanned || 0}`);
        console.log(`   总文件数: ${result.totalFiles || 0}`);
        console.log(`   扫描耗时: ${(result.duration || 0) / 1000}秒`);
        
        if (result.permissions && result.permissions.length > 0) {
            console.log(`   检测到权限: ${result.permissions.length}个`);
            console.log(`   权限列表: ${result.permissions.join(', ')}`);
        }
        
        if (result.thirdPartyServices && result.thirdPartyServices.length > 0) {
            console.log(`   第三方服务: ${result.thirdPartyServices.length}个`);
            console.log(`   服务列表: ${result.thirdPartyServices.join(', ')}`);
        }

        if (result.webApis && result.webApis.length > 0) {
            console.log(`   Web APIs: ${result.webApis.length}个`);
            console.log(`   API 列表: ${result.webApis.join(', ')}`);
        }

        // 保存结果到文件
        const resultPath = path.join(__dirname, 'test-result.json');
        await fs.writeFile(resultPath, JSON.stringify(result, null, 2), 'utf8');
        console.log(`\n📄 结果已保存到: ${resultPath}`);

        return true;
    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        console.error(error.stack);
        return false;
    }
}

testScan().then(success => {
    process.exit(success ? 0 : 1);
});

