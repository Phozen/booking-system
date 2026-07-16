import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('QA Audit: initial exploration', async ({ page }) => {
  await page.goto('https://booking-system-self-five.vercel.app/');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Let's dump the DOM to a file so we can inspect it
  const html = await page.content();
  fs.writeFileSync('initial-dom.html', html);
  
  // Try to find the login form
  // Assuming there's an email and password input
  await page.fill('input[type="email"]', 'angelo_superadmin@email.com');
  await page.fill('input[type="password"]', '[REDACTED]');
  
  // Assuming there's a button to submit
  await page.click('button[type="submit"]');

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const loggedInHtml = await page.content();
  fs.writeFileSync('loggedin-dom.html', loggedInHtml);

  // Print all visible links and buttons
  const links = await page.$$eval('a', els => els.map(el => el.textContent));
  const buttons = await page.$$eval('button', els => els.map(el => el.textContent));
  
  console.log("LINKS: ", links);
  console.log("BUTTONS: ", buttons);
});
