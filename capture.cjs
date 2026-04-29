const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set viewport for desktop
    await page.setViewport({ width: 1440, height: 900 });
    
    console.log('Navigating to local dev server...');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' });
    
    console.log('Saving desktop PDF...');
    await page.pdf({ path: '../Login_Design_Desktop.pdf', format: 'A4', landscape: true, printBackground: true });
    
    // Set viewport for mobile
    await page.setViewport({ width: 375, height: 812 });
    console.log('Saving mobile PDF...');
    await page.pdf({ path: '../Login_Design_Mobile.pdf', format: 'A4', printBackground: true });

    console.log('Done! PDFs generated in the project root.');
    await browser.close();
})();
