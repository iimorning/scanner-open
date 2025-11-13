const fs = require('fs').promises;
const path = require('path');

/**
 * 文件操作工具函数 - 简化版本（开源项目专用）
 */
class FileUtils {
    /**
     * 检测项目类型
     * @param {string} projectPath 项目路径
     * @returns {Promise<string>} 项目类型
     */
    static async detectProjectType(projectPath) {
        // 字符串路径快速判定
        if (typeof projectPath === 'string') {
            const p = projectPath.toLowerCase();
            if (p.includes('info.plist') || p.includes('.xcodeproj') || p.includes('swift')) return 'ios';
            if (p.includes('androidmanifest.xml') || p.includes('gradle')) return 'android';
        }

        try {
            const files = await fs.readdir(projectPath);

            // Flutter 项目
            if (files.includes('pubspec.yaml')) {
                return 'flutter';
            }

            // Android 项目
            if (files.includes('android') || files.some(f => f.includes('gradle'))) {
                return 'android';
            }

            // iOS 项目
            if (files.includes('ios') || files.some(f => f.endsWith('.xcodeproj')) || projectPath.includes('Info.plist')) {
                return 'ios';
            }

            // React / React Native / Web 项目
            if (files.includes('package.json')) {
                try {
                    const packageJson = JSON.parse(
                        await fs.readFile(path.join(projectPath, 'package.json'), 'utf8')
                    );
                    if (packageJson.dependencies) {
                        if (packageJson.dependencies['react-native']) return 'react-native';
                        if (packageJson.dependencies['react'] || packageJson.dependencies['vue'] || packageJson.dependencies['angular']) {
                            return 'web';
                        }
                    }
                } catch {
                    // 解析 package.json 失败时继续
                }
                return 'web';
            }

            // 默认按 web 处理
            return 'web';
        } catch (error) {
            return 'web';
        }
    }

    /**
     * 判断是否应该跳过目录
     * @param {string} dirName 目录名
     * @returns {boolean} 是否跳过
     */
    static shouldSkipDirectory(dirName) {
        const lower = dirName.toLowerCase();
        const name = lower.split(/[\\/]/).pop();
        const skipDirectories = [
            'node_modules', '.git', '.vscode', '.idea', 'dist', 'build', 'out',
            'coverage', '.nyc_output', 'bower_components', 'jspm_packages', 'tmp', 'temp'
        ];

        const shouldSkip = skipDirectories.includes(name) || name.startsWith('.');
        return shouldSkip;
    }

    /**
     * 判断是否应该扫描文件
     * @param {string} fileName 文件名
     * @returns {boolean} 是否扫描
     */
    static shouldScanFile(fileName) {
        // 跳过特定文件
        const skipFiles = [
            '.DS_Store', 'Thumbs.db', '.gitignore', '.npmignore',
            '.eslintrc', '.prettierrc', 'package-lock.json', 'yarn.lock'
        ];

        if (skipFiles.includes(fileName)) {
            return false;
        }

        // 检查文件扩展名
        const lower = fileName.toLowerCase();
        const parts = lower.split('.');
        const ext = parts.length > 1 ? '.' + parts.pop() : '';
        const fullExt = lower.endsWith('.min.js') ? '.js' : ext;

        const supportedExtensions = [
            '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
            '.java', '.kt', '.scala', '.swift', '.m', '.mm', '.h',
            '.xml', '.json', '.plist', '.html', '.htm', '.css',
            '.scss', '.sass', '.less', '.py', '.rb', '.go', '.rs'
        ];

        return supportedExtensions.includes(fullExt) ||
               lower.includes('androidmanifest') ||
               lower.includes('info.plist');
    }

    /**
     * 获取所有支持的文件扩展名
     * @returns {Array<string>} 扩展名列表
     */
    static getSupportedExtensions() {
        return [
            '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
            '.java', '.kt', '.scala', '.swift', '.m', '.mm', '.h',
            '.xml', '.json', '.plist', '.html', '.htm', '.css',
            '.scss', '.sass', '.less', '.py', '.rb', '.go', '.rs'
        ];
    }

    /**
     * 分析项目复杂度
     * @param {string} projectPath 项目路径
     * @returns {Promise<Object>} 复杂度分析结果
     */
    static async analyzeProjectComplexity(projectPath) {
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            codeFiles: 0,
            configFiles: 0,
            hasNativeCode: false,
            hasWebComponents: false,
            complexityScore: 0
        };

        try {
            await this.walkDirectory(projectPath, stats);

            // 计算复杂度评分
            stats.complexityScore = Math.min(
                stats.codeFiles * 0.1 +
                stats.configFiles * 0.05 +
                (stats.hasNativeCode ? 10 : 0) +
                (stats.hasWebComponents ? 5 : 0),
                100
            );
        } catch (error) {
            // 分析失败时返回默认值
        }

        return stats;
    }

    /**
     * 递归遍历目录进行复杂度分析
     * @param {string} dirPath 目录路径
     * @param {Object} stats 统计对象
     */
    static async walkDirectory(dirPath, stats, depth = 0) {
        // 防止递归过深
        if (depth > 5) return;

        try {
            const items = await fs.readdir(dirPath, { withFileTypes: true });

            for (const item of items) {
                const fullPath = path.join(dirPath, item.name);

                if (item.isDirectory()) {
                    if (!this.shouldSkipDirectory(item.name)) {
                        await this.walkDirectory(fullPath, stats, depth + 1);
                    }
                } else if (item.isFile()) {
                    stats.totalFiles++;

                    try {
                        const fileStat = await fs.stat(fullPath);
                        stats.totalSize += fileStat.size;
                    } catch {
                        // 忽略文件大小获取错误
                    }

                    if (this.shouldScanFile(item.name)) {
                        stats.codeFiles++;

                        // 检测原生代码
                        const nativeExtensions = ['.java', '.kt', '.swift', '.m', '.mm', '.h'];
                        if (nativeExtensions.some(ext => item.name.toLowerCase().endsWith(ext))) {
                            stats.hasNativeCode = true;
                        }

                        // 检测 Web 组件
                        const webExtensions = ['.js', '.jsx', '.tsx', '.vue', '.svelte', '.html'];
                        if (webExtensions.some(ext => item.name.toLowerCase().endsWith(ext))) {
                            stats.hasWebComponents = true;
                        }
                    } else {
                        stats.configFiles++;
                    }
                }
            }
        } catch (error) {
            // 忽略目录读取错误
        }
    }
}

module.exports = FileUtils;