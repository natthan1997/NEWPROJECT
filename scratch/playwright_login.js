const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));

  console.log("Navigating to login...");
  await page.goto('http://localhost:3010/login');
  
  // We can't easily type password without knowing a real account, 
  // but we can execute router.push directly or mock AuthContext on the real server?
  // No, we can just observe if there's any hydration error on login.
  
  await browser.close();
})();
