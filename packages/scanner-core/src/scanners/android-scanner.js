const BaseScanner = require('./base-scanner');

/**
 * Android 项目扫描器
 * 专门扫描 Android 相关的隐私功能
 */
class AndroidScanner extends BaseScanner {
    constructor() {
        super();
        this.name = 'AndroidScanner';
        this.supportedExtensions = ['java', 'kt', 'xml', 'gradle'];
        
        // Android 特定的模式
        this.patterns = {
            permissions: {
                'CAMERA': /android\.permission\.CAMERA|uses-permission.*CAMERA/gi,
                'LOCATION_FINE': /android\.permission\.ACCESS_FINE_LOCATION/gi,
                'LOCATION_COARSE': /android\.permission\.ACCESS_COARSE_LOCATION/gi,
                'MICROPHONE': /android\.permission\.RECORD_AUDIO/gi,
                'CONTACTS_READ': /android\.permission\.READ_CONTACTS/gi,
                'CONTACTS_WRITE': /android\.permission\.WRITE_CONTACTS/gi,
                'STORAGE_READ': /android\.permission\.READ_EXTERNAL_STORAGE/gi,
                'STORAGE_WRITE': /android\.permission\.WRITE_EXTERNAL_STORAGE/gi,
                'PHONE_STATE': /android\.permission\.READ_PHONE_STATE/gi,
                'CALL_PHONE': /android\.permission\.CALL_PHONE/gi,
                'SMS_SEND': /android\.permission\.SEND_SMS/gi,
                'SMS_READ': /android\.permission\.READ_SMS/gi,
                'CALENDAR_READ': /android\.permission\.READ_CALENDAR/gi,
                'CALENDAR_WRITE': /android\.permission\.WRITE_CALENDAR/gi,
                'BIOMETRIC': /android\.permission\.USE_BIOMETRIC|USE_FINGERPRINT/gi
            },
            
            apis: {
                'CAMERA_API': /Camera\.|CameraX|Camera2/gi,
                'LOCATION_API': /LocationManager|FusedLocationProviderClient/gi,
                'AUDIO_RECORD': /AudioRecord|MediaRecorder/gi,
                'CONTACTS_API': /ContactsContract/gi,
                'TELEPHONY': /TelephonyManager/gi,
                'SMS_API': /SmsManager/gi,
                'BIOMETRIC_API': /BiometricPrompt|FingerprintManager/gi
            },
            
            thirdPartyLibs: {
                'FIREBASE': /com\.google\.firebase|firebase-/gi,
                'GOOGLE_PLAY_SERVICES': /com\.google\.android\.gms/gi,
                'FACEBOOK_SDK': /com\.facebook\.android/gi,
                'ADMOB': /com\.google\.android\.gms\.ads/gi,
                'CRASHLYTICS': /com\.crashlytics|firebase-crashlytics/gi,
                'ANALYTICS': /com\.google\.analytics|firebase-analytics/gi,
                'APPSFLYER': /com\.appsflyer/gi,
                'ADJUST': /com\.adjust\.sdk/gi
            }
        };
    }
    
    /**
     * 扫描 Android 文件
     * @param {string} content 文件内容
     * @param {string} filePath 文件路径
     * @returns {Object} 扫描结果
     */
    scan(content, filePath) {
        console.log(`     🤖 [AndroidScanner] 开始扫描Android文件: ${filePath}`);

        const result = {
            scanner: this.name,
            filePath,
            permissions: [],
            apis: [],
            thirdPartyLibs: [],
            dataCollection: []
        };

        // 扫描权限
        result.permissions = this.scanPatterns(content, this.patterns.permissions);
        if (result.permissions.length > 0) {
            console.log(`     🔐 [AndroidScanner] 检测到权限: ${result.permissions.join(', ')}`);
        }

        // 扫描 API 使用
        result.apis = this.scanPatterns(content, this.patterns.apis);
        if (result.apis.length > 0) {
            console.log(`     📱 [AndroidScanner] 检测到API使用: ${result.apis.join(', ')}`);
        }

        // 扫描第三方库
        result.thirdPartyLibs = this.scanPatterns(content, this.patterns.thirdPartyLibs);
        if (result.thirdPartyLibs.length > 0) {
            console.log(`     📚 [AndroidScanner] 检测到第三方库: ${result.thirdPartyLibs.join(', ')}`);
        }

        // 特殊处理 AndroidManifest.xml
        if (filePath.includes('AndroidManifest.xml')) {
            console.log(`     📋 [AndroidScanner] 特殊处理AndroidManifest.xml文件...`);
            result.dataCollection = this.scanManifestDataCollection(content);
            if (result.dataCollection.length > 0) {
                console.log(`     📊 [AndroidScanner] 检测到数据收集功能: ${result.dataCollection.join(', ')}`);
            }
        }

        // 特殊处理 Gradle 文件
        if (filePath.includes('.gradle')) {
            console.log(`     🔧 [AndroidScanner] 特殊处理Gradle文件...`);
            result.dependencies = this.scanGradleDependencies(content);
            if (result.dependencies.length > 0) {
                console.log(`     📦 [AndroidScanner] 检测到依赖: ${result.dependencies.length}个`);
            }
        }

        const totalFeatures = result.permissions.length + result.apis.length +
                             result.thirdPartyLibs.length + result.dataCollection.length;
        console.log(`     ✅ [AndroidScanner] 扫描完成，共检测到 ${totalFeatures} 个隐私相关功能`);

        return result;
    }
    
    /**
     * 扫描 AndroidManifest.xml 中的数据收集相关配置
     * @param {string} content 文件内容
     * @returns {Array} 数据收集功能
     */
    scanManifestDataCollection(content) {
        const dataCollection = [];
        
        // 检查网络权限
        if (/android\.permission\.INTERNET/gi.test(content)) {
            dataCollection.push('NETWORK_ACCESS');
        }
        
        // 检查网络状态权限
        if (/android\.permission\.ACCESS_NETWORK_STATE/gi.test(content)) {
            dataCollection.push('NETWORK_STATE');
        }
        
        // 检查设备 ID 相关权限
        if (/android\.permission\.READ_PHONE_STATE/gi.test(content)) {
            dataCollection.push('DEVICE_ID');
        }
        
        return dataCollection;
    }
    
    /**
     * 扫描 Gradle 依赖
     * @param {string} content 文件内容
     * @returns {Array} 依赖列表
     */
    scanGradleDependencies(content) {
        const dependencies = [];
        const depPattern = /implementation\s+['"]([^'"]+)['"]/gi;
        let match;
        
        while ((match = depPattern.exec(content)) !== null) {
            dependencies.push(match[1]);
        }
        
        return dependencies;
    }
}

module.exports = AndroidScanner;

