const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');

describe('Attendance System Automated Tests', function() {
    this.timeout(30000);
    let driver;

    before(async function() {
        driver = await new Builder().forBrowser('chrome').build();
    });

    after(async function() {
        if (driver) await driver.quit();
    });

    it('1. Verify page title and table render', async function() {
        await driver.get('http://localhost:3000');
        await driver.wait(until.elementLocated(By.id('attendanceTable')), 5000);
        let rows = await driver.findElements(By.css('#attendanceTable tbody tr'));
        assert.strictEqual(rows.length, 5);
    });

    it('2. Verify period status toggling and saving', async function() {
        let toggle = await driver.findElement(By.css('.status-toggle'));
        await toggle.click();
        
        let saveBtn = await driver.findElement(By.id('saveBtn'));
        await saveBtn.click();
        
        await driver.wait(async () => {
            try {
                let alert = await driver.switchTo().alert();
                await alert.accept();
                return true;
            } catch (e) {
                return false;
            }
        }, 5000);
    });

    it('3. Verify monthly report generation', async function() {
        let reportBtn = await driver.findElement(By.id('loadReportBtn'));
        await reportBtn.click();
        
        await driver.sleep(1000);
        let reportRows = await driver.findElements(By.css('#reportTable tbody tr'));
        assert.ok(reportRows.length > 0);
    });
});
