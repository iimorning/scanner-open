const ScannerManager = require('./scanner-manager');
const BaseScanner = require('./scanners/base-scanner');
const AndroidScanner = require('./scanners/android-scanner');
const IOSScanner = require('./scanners/ios-scanner');
const WebScanner = require('./scanners/web-scanner');

module.exports = {
    ScannerManager,
    BaseScanner,
    AndroidScanner,
    IOSScanner,
    WebScanner
};

