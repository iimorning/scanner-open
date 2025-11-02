/**
 * 基础扫描器抽象类
 * 定义所有扫描器的通用接口
 */
class BaseScanner {
    constructor() {
        this.name = 'BaseScanner';
        this.supportedExtensions = [];
        this.patterns = {};
    }
    
    /**
     * 检查是否支持该文件
     * @param {string} fileName 文件名
     * @returns {boolean} 是否支持
     */
    supports(fileName) {
        const lower = fileName.toLowerCase();
        const ext = this.getFileExtension(lower);
        return this.supportedExtensions.includes(ext);
    }
    
    /**
     * 扫描文件内容
     * @param {string} content 文件内容
     * @param {string} filePath 文件路径
     * @returns {Object} 扫描结果
     */
    scan(content, filePath) {
        throw new Error('scan method must be implemented by subclass');
    }
    
    /**
     * 获取文件扩展名
     * @param {string} fileName 文件名
     * @returns {string} 扩展名
     */
    getFileExtension(fileName) {
        const name = fileName.toLowerCase();
        if (!name.includes('.') || name.endsWith('.')) return '';
        const parts = name.split('.');
        return parts.pop();
    }
    
    /**
     * 扫描模式匹配
     * @param {string} content 文件内容
     * @param {Object} patterns 模式对象
     * @returns {Array} 匹配结果
     */
    scanPatterns(content, patterns) {
        const results = [];
        Object.entries(patterns).forEach(([key, pattern]) => {
            if (pattern.test(content)) {
                results.push(key);
            }
        });
        return results;
    }
}

module.exports = BaseScanner;

