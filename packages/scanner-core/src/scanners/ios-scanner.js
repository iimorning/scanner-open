const BaseScanner = require('./base-scanner');

/**
 * iOS 项目扫描器
 * 专门扫描 iOS 相关的隐私功能
 */
class IOSScanner extends BaseScanner {
    constructor() {
        super();
        this.name = 'IOSScanner';
        this.supportedExtensions = ['swift', 'm', 'h', 'plist'];
        
        // iOS 特定的模式
        this.patterns = {
            permissions: {
                'CAMERA': /NSCameraUsageDescription/gi,
                'LOCATION_WHEN_IN_USE': /NSLocationWhenInUseUsageDescription/gi,
                'LOCATION_ALWAYS': /NSLocationAlwaysAndWhenInUseUsageDescription/gi,
                'MICROPHONE': /NSMicrophoneUsageDescription/gi,
                'CONTACTS': /NSContactsUsageDescription/gi,
                'PHOTOS': /NSPhotoLibraryUsageDescription/gi,
                'CALENDAR': /NSCalendarsUsageDescription/gi,
                'REMINDERS': /NSRemindersUsageDescription/gi,
                'MOTION': /NSMotionUsageDescription/gi,
                'HEALTH': /NSHealthUpdateUsageDescription|NSHealthShareUsageDescription/gi,
                'HOMEKIT': /NSHomeKitUsageDescription/gi,
                'MEDIA_LIBRARY': /NSAppleMusicUsageDescription/gi,
                'SPEECH_RECOGNITION': /NSSpeechRecognitionUsageDescription/gi,
                'SIRI': /NSSiriUsageDescription/gi,
                'FACE_ID': /NSFaceIDUsageDescription/gi
            },
            
            apis: {
                'CAMERA_API': /AVCaptureDevice|AVCaptureSession|UIImagePickerController/gi,
                'LOCATION_API': /CLLocationManager|CLLocation/gi,
                'AUDIO_API': /AVAudioRecorder|AVAudioPlayer/gi,
                'CONTACTS_API': /CNContactStore|ABAddressBook/gi,
                'PHOTOS_API': /PHPhotoLibrary|ALAssetsLibrary/gi,
                'CALENDAR_API': /EKEventStore/gi,
                'MOTION_API': /CMMotionManager/gi,
                'HEALTHKIT_API': /HKHealthStore/gi,
                'HOMEKIT_API': /HMHomeManager/gi,
                'BIOMETRIC_API': /LABiometryType|LAContext/gi,
                'KEYCHAIN_API': /SecItemAdd|SecItemCopyMatching/gi
            },
            
            thirdPartyLibs: {
                'FIREBASE': /Firebase|FIR/gi,
                'GOOGLE_ANALYTICS': /GoogleAnalytics|GAI/gi,
                'FACEBOOK_SDK': /FBSDKCoreKit|FacebookCore/gi,
                'ADMOB': /GoogleMobileAds|GAD/gi,
                'CRASHLYTICS': /Crashlytics|FirebaseCrashlytics/gi,
                'APPSFLYER': /AppsFlyerLib/gi,
                'ADJUST': /Adjust/gi,
                'MIXPANEL': /Mixpanel/gi,
                'AMPLITUDE': /Amplitude/gi,
                'FLURRY': /Flurry/gi
            }
        };
    }
    
    /**
     * 扫描 iOS 文件
     * @param {string} content 文件内容
     * @param {string} filePath 文件路径
     * @returns {Object} 扫描结果
     */
    scan(content, filePath) {
        console.log(`     🍎 [IOSScanner] 开始扫描iOS文件: ${filePath}`);

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
            console.log(`     🔐 [IOSScanner] 检测到权限: ${result.permissions.join(', ')}`);
        }

        // 扫描 API 使用
        result.apis = this.scanPatterns(content, this.patterns.apis);
        if (result.apis.length > 0) {
            console.log(`     📱 [IOSScanner] 检测到API使用: ${result.apis.join(', ')}`);
        }

        // 扫描第三方库
        result.thirdPartyLibs = this.scanPatterns(content, this.patterns.thirdPartyLibs);
        if (result.thirdPartyLibs.length > 0) {
            console.log(`     📚 [IOSScanner] 检测到第三方库: ${result.thirdPartyLibs.join(', ')}`);
        }

        // 特殊处理 Info.plist
        if (filePath.includes('Info.plist')) {
            console.log(`     📋 [IOSScanner] 特殊处理Info.plist文件...`);
            result.dataCollection = this.scanPlistDataCollection(content);
            if (result.dataCollection.length > 0) {
                console.log(`     📊 [IOSScanner] 检测到数据收集功能: ${result.dataCollection.join(', ')}`);
            }
        }

        // 扫描数据收集相关代码
        const codeDataCollection = this.scanCodeDataCollection(content);
        if (codeDataCollection.length > 0) {
            console.log(`     🔍 [IOSScanner] 检测到代码中的数据收集: ${codeDataCollection.join(', ')}`);
        }
        result.dataCollection.push(...codeDataCollection);

        const totalFeatures = result.permissions.length + result.apis.length +
                             result.thirdPartyLibs.length + result.dataCollection.length;
        console.log(`     ✅ [IOSScanner] 扫描完成，共检测到 ${totalFeatures} 个隐私相关功能`);

        return result;
    }
    
    /**
     * 扫描 Info.plist 中的数据收集相关配置
     * @param {string} content 文件内容
     * @returns {Array} 数据收集功能
     */
    scanPlistDataCollection(content) {
        const dataCollection = [];
        
        // 检查网络相关配置
        if (/NSAppTransportSecurity/gi.test(content)) {
            dataCollection.push('NETWORK_ACCESS');
        }
        
        // 检查广告标识符
        if (/SKAdNetwork/gi.test(content)) {
            dataCollection.push('ADVERTISING_ID');
        }
        
        // 检查后台模式
        if (/UIBackgroundModes/gi.test(content)) {
            dataCollection.push('BACKGROUND_PROCESSING');
        }
        
        return dataCollection;
    }
    
    /**
     * 扫描代码中的数据收集功能
     * @param {string} content 文件内容
     * @returns {Array} 数据收集功能
     */
    scanCodeDataCollection(content) {
        const dataCollection = [];
        
        // 检查设备标识符
        if (/identifierForVendor|advertisingIdentifier/gi.test(content)) {
            dataCollection.push('DEVICE_ID');
        }
        
        // 检查用户输入
        if (/UITextField|UITextView/gi.test(content)) {
            dataCollection.push('USER_INPUT');
        }
        
        // 检查网络请求
        if (/URLSession|NSURLConnection|Alamofire/gi.test(content)) {
            dataCollection.push('NETWORK_REQUESTS');
        }
        
        // 检查本地存储
        if (/UserDefaults|CoreData|SQLite/gi.test(content)) {
            dataCollection.push('LOCAL_STORAGE');
        }
        
        return dataCollection;
    }
}

module.exports = IOSScanner;

