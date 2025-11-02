const assert = require('assert');
const sinon = require('sinon');
const ScannerManager = require('../src/scanner-manager');
const AndroidScanner = require('../src/scanners/android-scanner');
const IOSScanner = require('../src/scanners/ios-scanner');
const WebScanner = require('../src/scanners/web-scanner');

describe('ScannerManager', () => {
    let scannerManager;

    beforeEach(() => {
        scannerManager = new ScannerManager({
            logger: {
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {}
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('constructor', () => {
        it('should initialize with all scanners', () => {
            assert.equal(scannerManager.scanners.length, 3);
            assert.ok(scannerManager.scanners.some(s => s.name === 'AndroidScanner'));
            assert.ok(scannerManager.scanners.some(s => s.name === 'IOSScanner'));
            assert.ok(scannerManager.scanners.some(s => s.name === 'WebScanner'));
        });
    });

    describe('getSupportedScanners', () => {
        it('should return scanners that support the file', () => {
            const supportedScanners = scannerManager.getSupportedScanners('test.java');
            assert.equal(supportedScanners.length, 1);
            assert.equal(supportedScanners[0].name, 'AndroidScanner');
        });

        it('should return empty array when no scanners support the file', () => {
            const supportedScanners = scannerManager.getSupportedScanners('test.txt');
            assert.deepStrictEqual(supportedScanners, []);
        });
    });

    describe('scanFile', () => {
        it('should scan file with supported scanners', () => {
            const mockContent = 'const x = 1;';
            const mockFilePath = '/path/to/test.js';

            const results = scannerManager.scanFile(mockContent, mockFilePath);

            assert.ok(Array.isArray(results));
        });
    });

    describe('mergeResults', () => {
        it('should merge multiple scan results correctly', () => {
            const results = [
                {
                    scanner: 'WebScanner',
                    permissions: ['CAMERA', 'LOCATION'],
                    thirdPartyServices: ['GOOGLE_ANALYTICS']
                },
                {
                    scanner: 'AndroidScanner',
                    permissions: ['LOCATION', 'CONTACTS_READ'],
                    apis: ['GPS_API']
                }
            ];

            const merged = scannerManager.mergeResults(results);

            assert.ok(merged.scanners.includes('WebScanner'));
            assert.ok(merged.scanners.includes('AndroidScanner'));
            assert.ok(merged.permissions.includes('CAMERA'));
            assert.ok(merged.permissions.includes('LOCATION'));
        });
    });
});

