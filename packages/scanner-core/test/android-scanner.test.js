const assert = require('assert');
const AndroidScanner = require('../src/scanners/android-scanner');

describe('AndroidScanner', () => {
    let androidScanner;

    beforeEach(() => {
        androidScanner = new AndroidScanner();
    });

    describe('supports', () => {
        it('should support Java files', () => {
            assert.ok(androidScanner.supports('test.java'));
        });

        it('should support XML files', () => {
            assert.ok(androidScanner.supports('AndroidManifest.xml'));
        });

        it('should not support unsupported file types', () => {
            assert.ok(!androidScanner.supports('test.js'));
        });
    });

    describe('scan', () => {
        it('should scan AndroidManifest.xml for permissions', () => {
            const content = `
                <manifest xmlns:android="http://schemas.android.com/apk/res/android">
                    <uses-permission android:name="android.permission.CAMERA" />
                    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
                </manifest>
            `;
            
            const result = androidScanner.scan(content, '/test/AndroidManifest.xml');
            
            assert.ok(result.permissions.includes('CAMERA'));
            assert.ok(result.permissions.includes('LOCATION_FINE'));
        });

        it('should scan Java files for API usage', () => {
            const content = `
                import android.hardware.Camera;
                public class MainActivity {
                    private Camera camera;
                }
            `;
            
            const result = androidScanner.scan(content, '/test/MainActivity.java');
            
            assert.ok(result.apis.includes('CAMERA_API'));
        });
    });
});

