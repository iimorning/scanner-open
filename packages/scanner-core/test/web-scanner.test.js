const assert = require('assert');
const WebScanner = require('../src/scanners/web-scanner');

describe('WebScanner', () => {
    let webScanner;

    beforeEach(() => {
        webScanner = new WebScanner();
    });

    describe('supports', () => {
        it('should support HTML files', () => {
            assert.ok(webScanner.supports('index.html'));
        });

        it('should support JavaScript files', () => {
            assert.ok(webScanner.supports('app.js'));
        });

        it('should not support unsupported file types', () => {
            assert.ok(!webScanner.supports('image.png'));
        });
    });

    describe('scan', () => {
        it('should detect location permissions in JavaScript', () => {
            const jsContent = `
                navigator.geolocation.getCurrentPosition(position => {
                    console.log('Location:', position);
                });
            `;

            const result = webScanner.scan(jsContent, '/test/app.js');

            assert.ok(result.webApis.some(api => api.includes('GEOLOCATION')));
        });

        it('should detect third-party services', () => {
            const htmlContent = `
                <script src="https://www.googletagmanager.com/gtag/js"></script>
                <script>
                    gtag('config', 'UA-XXXXX-Y');
                </script>
            `;

            const result = webScanner.scan(htmlContent, '/test/index.html');

            assert.ok(result.thirdPartyServices.some(s => s.includes('GOOGLE_ANALYTICS')));
        });
    });
});

