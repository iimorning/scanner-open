const fs = require('fs').promises;
const path = require('path');
const AndroidScanner = require('./scanners/android-scanner');
const IOSScanner = require('./scanners/ios-scanner');
const WebScanner = require('./scanners/web-scanner');

/**
 * 扫描器管理器
 * 负责管理和协调不同类型的扫描器，支持项目级扫描
 */
class ScannerManager {
    constructor(options = {}) {
        this.enableParallelScanning = options.enableParallelScanning !== false;
        this.maxConcurrentScans = options.maxConcurrentScans || 3;
        this.scanTimeout = options.scanTimeout || 60000;
        this.logger = options.logger || this.createDefaultLogger();
        
        const safeNew = (Cls) => {
            try {
                const provisional = Object.create(Cls.prototype);
                const maybeMock = Cls.prototype.constructor.call(provisional);
                return maybeMock || provisional;
            } catch {
                return new Cls();
            }
        };
        
        this.scanners = [
            safeNew(AndroidScanner),
            safeNew(IOSScanner),
            safeNew(WebScanner)
        ];
        
        this.scanHistory = new Map();
    }

    /**
     * 创建默认日志器
     */
    createDefaultLogger() {
        return {
            debug: () => {},
            info: console.log,
            warn: console.warn,
            error: console.error
        };
    }

    /**
     * 添加新的扫描器
     * @param {Object} scanner 扫描器实例
     */
    addScanner(scanner) {
        this.scanners.push(scanner);
        this.logger.info(`添加新扫描器: ${scanner.name || 'Unknown'}`);
    }

    /**
     * 获取支持指定文件的扫描器
     * @param {string} fileName 文件名
     * @returns {Array} 支持的扫描器列表
     */
    getSupportedScanners(fileName) {
        return this.scanners.filter(scanner => scanner.supports(fileName));
    }

    /**
     * 扫描单个文件
     * @param {string} content 文件内容
     * @param {string} filePath 文件路径
     * @returns {Array} 扫描结果数组
     */
    scanFile(content, filePath) {
        const fileName = path.basename(filePath);
        const supportedScanners = this.getSupportedScanners(fileName).slice().reverse();

        this.logger.debug(`文件 ${fileName} 支持的扫描器: ${supportedScanners.map(s => s.name).join(', ')}`);

        const results = [];
        supportedScanners.forEach(scanner => {
            try {
                const result = scanner.scan(content, filePath);
                if (this.hasValidResults(result)) {
                    results.push(result);
                }
            } catch (error) {
                this.logger.warn(`扫描器 ${scanner.name} 处理文件 ${filePath} 时出错:`, error.message);
            }
        });

        return results;
    }

    /**
     * 扫描项目 - 主要入口点
     * @param {string} projectPath 项目路径
     * @param {Object} options 扫描选项
     * @returns {Promise<Object>} 扫描结果
     */
    async scanProject(projectPath, options = {}) {
        const scanId = this.generateScanId(projectPath, options);

        this.logger.info(`开始扫描项目: ${projectPath}`);

        try {
            // 检查扫描历史缓存
            const cached = this.getScanResult(scanId);
            if (cached && !options.forceRescan) {
                this.logger.info(`使用缓存扫描结果: ${scanId}`);
                return cached;
            }

            // 执行项目扫描
            const result = await this.executeProjectScan(projectPath, options);

            // 缓存扫描结果
            this.cacheScanResult(scanId, result);

            this.logger.info(`项目扫描完成: ${projectPath}`, {
                filesScanned: result.filesScanned || 0,
                permissionsFound: result.permissions?.length || 0,
                duration: result.duration || 0
            });

            return result;

        } catch (error) {
            this.logger.error(`项目扫描失败: ${projectPath}`, error);
            throw error;
        }
    }

    /**
     * 执行项目扫描
     * @param {string} projectPath 项目路径
     * @param {Object} options 扫描选项
     * @returns {Promise<Object>} 扫描结果
     */
    async executeProjectScan(projectPath, options = {}) {
        const startTime = Date.now();
        const result = {
            scanId: this.generateScanId(projectPath, options),
            projectPath,
            timestamp: new Date().toISOString(),
            files: [],
            filesScanned: 0,
            errors: [],
            warnings: [],
            summary: null
        };

        try {
            // 1. 获取项目文件列表
            const files = await this.getProjectFiles(projectPath, options);
            result.totalFiles = files.length;

            // 2. 并行或串行扫描文件
            if (this.enableParallelScanning && files.length > 1) {
                await this.scanFilesParallel(files, projectPath, result);
            } else {
                await this.scanFilesSequential(files, projectPath, result);
            }

            // 3. 合并扫描结果
            const scanResults = result.scanResults || [];
            const mergedResults = this.mergeResults(scanResults.map(r => r.results).flat());

            // 4. 生成最终结果
            Object.assign(result, mergedResults, {
                duration: Date.now() - startTime,
                filesScanned: scanResults.length
            });

        } catch (error) {
            result.errors.push(`扫描过程异常: ${error.message}`);
            throw error;
        }

        return result;
    }

    /**
     * 获取项目文件列表
     * @param {string} projectPath 项目路径
     * @param {Object} options 选项
     * @returns {Promise<Array>} 文件列表
     */
    async getProjectFiles(projectPath, options = {}) {
        const {
            includePatterns = ['**/*.{js,ts,jsx,tsx,java,kt,swift,m,xml,json,plist,html,css}'],
            excludePatterns = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
            maxFiles = 1000
        } = options;

        const files = [];

        try {
            await this.walkDirectory(projectPath, files, {
                includePatterns,
                excludePatterns,
                maxFiles
            });
        } catch (error) {
            this.logger.warn('获取项目文件列表失败:', error.message);
        }

        return files;
    }

    /**
     * 递归遍历目录
     * @param {string} dirPath 目录路径
     * @param {Array} files 文件列表
     * @param {Object} options 选项
     */
    async walkDirectory(dirPath, files, options) {
        if (files.length >= options.maxFiles) return;

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const relativePath = path.relative(options.root || dirPath, fullPath);

                // 检查是否应该排除
                if (this.shouldExclude(relativePath, options.excludePatterns)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    await this.walkDirectory(fullPath, files, { ...options, root: options.root || dirPath });
                } else if (entry.isFile()) {
                    if (this.shouldInclude(relativePath, options.includePatterns)) {
                        files.push({
                            path: fullPath,
                            name: entry.name,
                            relativePath: relativePath
                        });
                    }
                }

                if (files.length >= options.maxFiles) break;
            }
        } catch (error) {
            // 忽略权限错误等
            this.logger.debug(`无法读取目录 ${dirPath}: ${error.message}`);
        }
    }

    /**
     * 检查文件是否应该排除
     */
    shouldExclude(filePath, excludePatterns) {
        for (const pattern of excludePatterns) {
            if (this.matchesPattern(filePath, pattern)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查文件是否应该包含
     */
    shouldInclude(filePath, includePatterns) {
        for (const pattern of includePatterns) {
            if (this.matchesPattern(filePath, pattern)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 匹配文件模式
     */
    matchesPattern(filePath, pattern) {
        const regex = new RegExp(
            pattern.replace(/\*\*/g, '.*')
                  .replace(/\*/g, '[^/]*')
                  .replace(/\?/g, '[^/]')
        );
        return regex.test(filePath);
    }

    /**
     * 并行扫描文件
     */
    async scanFilesParallel(files, projectPath, result) {
        const scanResults = [];
        const chunks = this.chunkArray(files, this.maxConcurrentScans);

        for (const chunk of chunks) {
            const chunkPromises = chunk.map(async (file) => {
                try {
                    return await this.scanSingleFile(file, projectPath);
                } catch (error) {
                    this.logger.warn(`文件扫描失败: ${file.name}`, error.message);
                    return null;
                }
            });

            const chunkResults = await Promise.all(chunkPromises);
            scanResults.push(...chunkResults.filter(Boolean));
        }

        result.scanResults = scanResults;
    }

    /**
     * 串行扫描文件
     */
    async scanFilesSequential(files, projectPath, result) {
        const scanResults = [];

        for (const file of files) {
            try {
                const scanResult = await this.scanSingleFile(file, projectPath);
                if (scanResult) {
                    scanResults.push(scanResult);
                }
            } catch (error) {
                this.logger.warn(`文件扫描失败: ${file.name}`, error.message);
            }
        }

        result.scanResults = scanResults;
    }

    /**
     * 扫描单个文件
     */
    async scanSingleFile(file, projectPath) {
        const startTime = Date.now();

        try {
            const content = await fs.readFile(file.path, 'utf8');
            const fileName = file.name;

            // 获取支持此文件的扫描器
            const supportedScanners = this.getSupportedScanners(fileName);

            if (supportedScanners.length === 0) {
                this.logger.debug(`文件 ${fileName} 无支持的扫描器`);
                return null;
            }

            this.logger.debug(`扫描文件: ${fileName}, 支持的扫描器: ${supportedScanners.map(s => s.name).join(', ')}`);

            const results = [];

            for (const scanner of supportedScanners) {
                try {
                    const scanResult = scanner.scan(content, file.path);
                    if (this.hasValidResults(scanResult)) {
                        results.push({
                            ...scanResult,
                            scanner: scanner.name,
                            filePath: file.path,
                            fileName: file.name,
                            scanTime: Date.now() - startTime
                        });
                    }
                } catch (error) {
                    this.logger.warn(`扫描器 ${scanner.name} 处理文件 ${fileName} 时出错:`, error.message);
                }
            }

            return results.length > 0 ? { file, results } : null;

        } catch (error) {
            this.logger.warn(`读取文件失败: ${file.path}`, error.message);
            return null;
        }
    }

    /**
     * 检查扫描结果是否有效
     */
    hasValidResults(result) {
        const keys = Object.keys(result);
        return keys.some(key => {
            if (key === 'scanner' || key === 'filePath') return false;
            const value = result[key];
            return Array.isArray(value) ? value.length > 0 : Boolean(value);
        });
    }

    /**
     * 合并多个扫描结果
     */
    mergeResults(scanResults) {
        const merged = {
            scanners: [],
            permissions: new Set(),
            apis: new Set(),
            thirdPartyServices: new Set(),
            dataCollection: new Set(),
            storage: new Set(),
            tracking: new Set(),
            webApis: new Set(),
            dependencies: [],
            files: []
        };

        scanResults.forEach(result => {
            if (!result) return;

            if (result.scanner) {
                merged.scanners.push(result.scanner);
            }

            // 合并各种类型的结果
            this.mergeArrayField(result, merged, 'permissions');
            this.mergeArrayField(result, merged, 'apis');
            this.mergeArrayField(result, merged, 'thirdPartyServices');
            this.mergeArrayField(result, merged, 'thirdPartyLibs', 'thirdPartyServices');
            this.mergeArrayField(result, merged, 'dataCollection');
            this.mergeArrayField(result, merged, 'storage');
            this.mergeArrayField(result, merged, 'tracking');
            this.mergeArrayField(result, merged, 'webApis');

            // 合并依赖
            if (result.dependencies) {
                merged.dependencies.push(...result.dependencies);
            }
        });

        // 转换 Set 为 Array
        Object.keys(merged).forEach(key => {
            if (merged[key] instanceof Set) {
                merged[key] = Array.from(merged[key]);
            }
        });

        // 添加摘要信息
        merged.summary = this.generateAISummary(merged);

        return merged;
    }

    /**
     * 生成摘要信息
     */
    generateAISummary(merged) {
        return {
            privacyRiskLevel: this.assessPrivacyRisk(merged),
            mainFeatures: this.categorizeFeatures(merged),
            complianceHints: this.generateComplianceHints(merged),
            dataFlow: this.analyzeDataFlow(merged)
        };
    }

    /**
     * 评估隐私风险等级
     */
    assessPrivacyRisk(data) {
        let riskScore = 0;

        const sensitivePermissions = ['CAMERA', 'LOCATION_FINE', 'MICROPHONE', 'CONTACTS_READ'];
        riskScore += data.permissions.filter(p => sensitivePermissions.includes(p)).length * 2;
        riskScore += data.thirdPartyServices.length;
        riskScore += data.tracking.length * 1.5;

        if (riskScore >= 6) return 'HIGH';
        if (riskScore >= 3) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * 分类主要功能
     */
    categorizeFeatures(data) {
        const features = [];

        if (data.permissions.some(p => p.includes('LOCATION'))) {
            features.push('Location Services');
        }
        if (data.permissions.includes('CAMERA')) {
            features.push('Camera/Photo');
        }
        if (data.thirdPartyServices.some(s => s.includes('ANALYTICS'))) {
            features.push('Analytics');
        }
        if (data.tracking.length > 0) {
            features.push('User Tracking');
        }

        return features;
    }

    /**
     * 生成合规提示
     */
    generateComplianceHints(data) {
        const hints = [];

        if (data.permissions.some(p => p.includes('LOCATION'))) {
            hints.push('Location data requires explicit user consent and clear purpose explanation');
        }
        if (data.thirdPartyServices.length > 0) {
            hints.push('Third-party services must be disclosed with their privacy policies');
        }
        if (data.tracking.length > 0) {
            hints.push('Tracking requires user consent and opt-out mechanisms');
        }

        return hints;
    }

    /**
     * 分析数据流向
     */
    analyzeDataFlow(data) {
        return {
            collectsPersonalData: data.permissions.length > 0 || data.dataCollection.length > 0,
            sharesWithThirdParties: data.thirdPartyServices.length > 0,
            usesTracking: data.tracking.length > 0,
            storesLocally: data.storage.length > 0
        };
    }

    /**
     * 合并数组字段
     */
    mergeArrayField(source, target, sourceKey, targetKey = sourceKey) {
        if (source[sourceKey] && Array.isArray(source[sourceKey])) {
            source[sourceKey].forEach(item => {
                if (target[targetKey] instanceof Set) {
                    target[targetKey].add(item);
                }
            });
        }
    }

    /**
     * 生成扫描ID
     */
    generateScanId(projectPath, options) {
        const hash = this.simpleHash(`${projectPath}:${JSON.stringify(options)}`);
        return `scan_${Date.now()}_${hash}`;
    }

    /**
     * 简单哈希函数
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * 缓存扫描结果
     */
    cacheScanResult(scanId, result) {
        this.scanHistory.set(scanId, {
            result,
            timestamp: Date.now()
        });

        if (this.scanHistory.size > 100) {
            const oldestKey = this.scanHistory.keys().next().value;
            this.scanHistory.delete(oldestKey);
        }
    }

    /**
     * 获取扫描结果
     */
    getScanResult(scanId) {
        const cached = this.scanHistory.get(scanId);
        if (cached && Date.now() - cached.timestamp < 300000) {
            return cached.result;
        }
        return null;
    }

    /**
     * 数组分块
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * 获取扫描器统计
     */
    getStats() {
        return {
            totalScanners: this.scanners.length,
            scannerNames: this.scanners.map(s => s.name || 'Unknown'),
            cachedScans: this.scanHistory.size,
            parallelScanning: this.enableParallelScanning,
            maxConcurrentScans: this.maxConcurrentScans,
            scanTimeout: this.scanTimeout
        };
    }
}

module.exports = ScannerManager;

