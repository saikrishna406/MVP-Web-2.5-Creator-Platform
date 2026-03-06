const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            console.log('BROWSER:', msg.type(), msg.text());
        }
    });
    page.on('pageerror', err => console.log('PAGE UNHANDLED ERROR:', err.toString()));

    console.log("Navigating...");
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 2000));
    console.log("Reloading...");
    await page.reload({ waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 2000));

    await browser.close();
})();
