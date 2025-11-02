const BaseScanner = require('./base-scanner');

/**
 * Web 项目扫描器
 * 专门扫描 Web 应用的隐私功能
 */
class WebScanner extends BaseScanner {
    constructor() {
        super();
        this.name = 'WebScanner';
        this.supportedExtensions = ['js', 'mjs', 'ts', 'jsx', 'tsx', 'html', 'htm', 'xhtml', 'vue', 'svelte', 'css', 'scss', 'less', 'json'];
        
        // Web 特定的模式
        this.patterns = {
            webApis: {
                'GEOLOCATION': /navigator\.geolocation|getCurrentPosition/gi,
                'CAMERA': /navigator\.mediaDevices\.getUserMedia|video.*camera/gi,
                'MICROPHONE': /navigator\.mediaDevices\.getUserMedia|audio.*microphone/gi,
                'NOTIFICATIONS': /Notification\.requestPermission|new Notification/gi,
                'CLIPBOARD': /navigator\.clipboard|document\.execCommand.*copy/gi,
                'DEVICE_ORIENTATION': /DeviceOrientationEvent|DeviceMotionEvent/gi,
                'FULLSCREEN': /requestFullscreen|webkitRequestFullscreen|exitFullscreen|webkitExitFullscreen/gi,
                'SCREEN_CAPTURE': /getDisplayMedia|captureStream/gi
            },
            
            storage: {
                'COOKIES': /document\.cookie|Cookie/gi,
                'LOCAL_STORAGE': /localStorage\.|sessionStorage\./gi,
                'INDEXED_DB': /indexedDB|IDBDatabase/gi,
                'WEB_SQL': /openDatabase|webkitStorageInfo/gi,
                'CACHE_API': /caches\.|Cache/gi
            },
            
            tracking: {
                'GOOGLE_ANALYTICS': /gtag\(|ga\(|GoogleAnalytics|google-analytics|www\.googletagmanager\.com\/gtag\/js|dataLayer\s*=\s*\[/gi,
                'GOOGLE_TAG_MANAGER': /gtm\.|GoogleTagManager/gi,
                'FACEBOOK_PIXEL': /fbq\(|facebook.*pixel/gi,
                'MIXPANEL': /mixpanel\.|Mixpanel/gi,
                'AMPLITUDE': /amplitude\.|Amplitude/gi,
                'HOTJAR': /hotjar|hj\(/gi,
                'INTERCOM': /Intercom\(|intercom/gi,
                'ZENDESK': /zE\(|zendesk/gi,
                'CRISP': /crisp|CRISP_WEBSITE_ID/gi
            },
            
            thirdPartyServices: {
                'FIREBASE': /firebase|Firebase/gi,
                'AWS_SDK': /aws-sdk|AWS\./gi,
                'STRIPE': /Stripe\(|stripe\.js/gi,
                'PAYPAL': /paypal|PayPal/gi,
                'RECAPTCHA': /grecaptcha|recaptcha/gi,
                'MAPS': /google.*maps|mapbox|leaflet/gi,
                'SOCIAL_LOGIN': /oauth|OAuth|social.*login/gi,
                'FACEBOOK_SDK': /connect\.facebook\.net\/.*\/sdk\.js|FB\./gi
            },
            
            dataCollection: {
                'FORM_DATA': /<form|input.*type|FormData/gi,
                'USER_AGENT': /navigator\.userAgent/gi,
                'SCREEN_INFO': /screen\.|window\.screen/gi,
                'REFERRER': /document\.referrer/gi,
                'FINGERPRINTING': /canvas.*fingerprint|audio.*fingerprint/gi,
                'WEBSOCKETS': /WebSocket|socket\.io/gi,
                'FETCH_API': /fetch\(|axios\.|XMLHttpRequest/gi
            }
        };
    }
    
    /**
     * 扫描 Web 文件
     * @param {string} content 文件内容
     * @param {string} filePath 文件路径
     * @returns {Object} 扫描结果
     */
    scan(content, filePath) {
        const result = {
            scanner: this.name,
            filePath,
            webApis: [],
            storage: [],
            tracking: [],
            thirdPartyServices: [],
            dataCollection: [],
            permissions: []
        };
        
        // 扫描 Web APIs
        result.webApis = this.scanPatterns(content, this.patterns.webApis);
        
        // 扫描存储技术
        result.storage = this.scanPatterns(content, this.patterns.storage);
        
        // 扫描跟踪服务
        result.tracking = this.scanPatterns(content, this.patterns.tracking);
        
        // 扫描第三方服务
        const thirdPartyOrder = ['GOOGLE_ANALYTICS','GOOGLE_TAG_MANAGER','FIREBASE','FACEBOOK_PIXEL','FACEBOOK_SDK','MIXPANEL','AMPLITUDE','HOTJAR','INTERCOM','ZENDESK','CRISP','AWS_SDK','STRIPE','PAYPAL','RECAPTCHA','MAPS','SOCIAL_LOGIN'];
        const detected = this.scanPatterns(content, this.patterns.thirdPartyServices);
        result.thirdPartyServices = thirdPartyOrder.filter(name => detected.includes(name));
        if (result.tracking.includes('GOOGLE_ANALYTICS') && !result.thirdPartyServices.includes('GOOGLE_ANALYTICS')) {
            result.thirdPartyServices.unshift('GOOGLE_ANALYTICS');
        }
        
        // 扫描数据收集
        result.dataCollection = this.scanPatterns(content, this.patterns.dataCollection);
        
        // 特殊处理 HTML 文件
        if (filePath.endsWith('.html') || filePath.endsWith('.htm') || filePath.endsWith('.xhtml')) {
            result.htmlAnalysis = this.scanHtmlSpecific(content);
        }
        
        // 特殊处理 package.json
        if (filePath.includes('package.json')) {
            result.dependencies = this.scanPackageJsonDependencies(content);
        }
        
        // 从 API 使用推断权限
        if (result.webApis.includes('CAMERA')) {
            result.permissions.push('CAMERA');
        }
        if (result.webApis.some(api => api.includes('GEOLOCATION'))) {
            result.permissions.push('LOCATION');
        }

        return result;
    }
    
    /**
     * 扫描 HTML 特定内容
     * @param {string} content HTML 内容
     * @returns {Object} HTML 分析结果
     */
    scanHtmlSpecific(content) {
        const analysis = {
            externalScripts: [],
            metaTags: [],
            iframes: []
        };
        
        // 扫描外部脚本
        const scriptPattern = /<script[^>]*src=["']([^"']+)["']/gi;
        let match;
        while ((match = scriptPattern.exec(content)) !== null) {
            analysis.externalScripts.push(match[1]);
        }
        
        // 扫描 meta 标签
        const metaPattern = /<meta[^>]*>/gi;
        while ((match = metaPattern.exec(content)) !== null) {
            analysis.metaTags.push(match[0]);
        }
        
        // 扫描 iframe
        const iframePattern = /<iframe[^>]*src=["']([^"']+)["']/gi;
        while ((match = iframePattern.exec(content)) !== null) {
            analysis.iframes.push(match[1]);
        }
        
        return analysis;
    }
    
    /**
     * 扫描 package.json 依赖
     * @param {string} content package.json 内容
     * @returns {Array} 依赖列表
     */
    scanPackageJsonDependencies(content) {
        try {
            const packageData = JSON.parse(content);
            const dependencies = [];
            
            // 合并 dependencies 和 devDependencies
            const allDeps = {
                ...packageData.dependencies,
                ...packageData.devDependencies
            };
            
            Object.keys(allDeps || {}).forEach(dep => {
                dependencies.push({
                    name: dep,
                    version: allDeps[dep]
                });
            });
            
            return dependencies;
        } catch (error) {
            return [];
        }
    }
}

module.exports = WebScanner;

