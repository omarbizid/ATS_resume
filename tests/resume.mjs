import { chromium } from '@playwright/test';
import fs from 'node:fs';
import process from 'node:process';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
(async()=>{
fs.mkdirSync('test-results', { recursive: true });
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL || undefined,headless:true});
try {
const page=await browser.newPage({viewport:{width:1500,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=process.env.TEST_URL || 'http://127.0.0.1:5173/ATS_resume/';
await page.goto(url);
// A first visit shows the welcome dialog; keep the sample for the checks below.
await page.getByRole('button',{name:/Explore the sample/}).click();
await page.waitForTimeout(500);
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('cv-builder-data')));
const original=await saved();
// Removing an entry can be undone from the toast and with Ctrl+Z.
const removeFirstExperience=()=>page.getByText('Experience 1',{exact:true}).locator('xpath=..').locator('[title="Remove"]').click();
await removeFirstExperience();await page.waitForTimeout(300);
assert.equal((await saved()).experience.length,original.experience.length-1);
await page.getByRole('status').getByRole('button',{name:'Undo',exact:true}).click();await page.waitForTimeout(300);
assert.deepEqual((await saved()).experience,original.experience,'toast undo restores the entry');
await removeFirstExperience();await page.keyboard.press('Control+z');await page.waitForTimeout(300);
assert.deepEqual((await saved()).experience,original.experience,'Ctrl+Z restores the entry');
await page.getByRole('button',{name:'Designed resume',exact:true}).click();
await page.locator('#cv-preview .designed-page').waitFor();
const photo=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=180;c.height=240;const x=c.getContext('2d');x.fillStyle='#dfbb95';x.fillRect(0,0,180,240);x.fillStyle='#283c63';x.fillRect(20,140,140,100);x.fillStyle='#a16e44';x.beginPath();x.arc(90,85,47,0,Math.PI*2);x.fill();return c.toDataURL('image/png').split(',')[1]});
await page.getByLabel('Upload portrait').setInputFiles({name:'portrait.png',mimeType:'image/png',buffer:Buffer.from(photo,'base64')});
await page.locator('#cv-preview .designed-photo').waitFor();
await page.getByLabel('Accent colour').selectOption('#754354');
await page.waitForTimeout(350);
await page.reload();await page.locator('#cv-preview .designed-photo').waitFor();
assert.equal(await page.getByLabel('Accent colour').inputValue(),'#754354');
await page.screenshot({path:'test-results/designed-desktop.png',fullPage:true});
await page.locator('#cv-preview').screenshot({path:'test-results/designed-resume.png'});
const current=await page.evaluate(()=>JSON.parse(localStorage.getItem('cv-builder-data')));
for(const key of ['personal','summary','experience','education','skillGroups','certifications','languages','extracurriculars','projects','sectionSettings']) assert.deepEqual(current[key],original[key],key+' preserved');
await page.getByRole('button',{name:'ATS resume',exact:true}).click();
assert.equal(await page.locator('#cv-preview img').count(),0);
await page.getByRole('button',{name:'Designed resume',exact:true}).click();
assert.equal(await page.locator('#cv-preview .designed-photo').count(),1);
await page.getByLabel('Upload portrait').setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});
await page.getByRole('alert').filter({hasText:'Choose a JPG'}).waitFor();
await page.getByRole('button',{name:'ATS check',exact:true}).click();
assert.ok(await page.getByText('Designed resumes use columns').first().isVisible());
// "Fix this" opens the editor where the problem is fixed.
await page.getByRole('button',{name:'Fix this'}).first().click();
await page.waitForFunction(()=>document.getElementById('editor-design')?.contains(document.activeElement));
// Job description match lists covered and missing terms.
await page.getByRole('textbox',{name:'Job description',exact:true}).first().fill('We are hiring a React developer with TypeScript and Kubernetes. Kubernetes experience is a plus.');
assert.ok(await page.getByText(/Your CV mentions \d+ of \d+ key terms/).first().isVisible());
assert.ok(await page.locator('li',{hasText:/^kubernetes$/}).first().isVisible(),'missing term shown');
assert.ok(await page.locator('li',{hasText:/^react$/}).first().isVisible(),'found term shown');
await page.getByRole('button',{name:'ATS check',exact:true}).click();
// Capture the actual export window, then generate its PDF with real text and decoded photo.
await page.context().addInitScript(()=>{window.print=()=>{};});
const popupPromise=page.waitForEvent('popup');
await page.getByRole('button',{name:'Export PDF',exact:true}).click();
const popup=await popupPromise; await popup.waitForLoadState();
await popup.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
assert.equal(await popup.locator('img').count(),1);
assert.equal(await popup.locator('li').first().evaluate(e=>getComputedStyle(e).listStyleType),'disc');
await popup.pdf({path:'test-results/designed-export.pdf',printBackground:true,preferCSSPageSize:true});
await popup.close();
// JSON backup round-trip, including the photo and appearance.
const downloadPromise = page.waitForEvent('download');
// JSON backups live in the File menu.
const openFileMenu=()=>page.getByRole('button',{name:'File',exact:true}).click();
await openFileMenu();
await page.getByRole('button', {name:'Export JSON backup',exact:true}).click();
const download = await downloadPromise;
const backup = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
assert.ok(backup.design.photo.startsWith('data:image/jpeg;base64,'));
await page.getByRole('button',{name:'Remove photo',exact:true}).click();
assert.equal(await page.locator('#cv-preview img').count(),0);
await openFileMenu();
await page.locator('input[accept=".json"]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
await page.locator('#cv-preview .designed-photo').waitFor();
// Old ATS JSON without projects still works and can be converted.
const legacy = {...original}; delete legacy.projects;
legacy.sectionSettings = legacy.sectionSettings.filter(s=>s.key !== 'projects');
await openFileMenu();
await page.locator('input[accept=".json"]').setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacy)) });
await page.getByRole('button',{name:'Designed resume',exact:true}).click();
await page.locator('#cv-preview .designed-page').waitFor();
assert.equal(await page.locator('#cv-preview img').count(),0);
// Restore portrait for the responsive screenshot.
await openFileMenu();
await page.locator('input[accept=".json"]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
await page.setViewportSize({width:390,height:844});
await page.getByRole('button',{name:'Preview',exact:true}).click();
await page.screenshot({path:'test-results/designed-mobile.png'});
// On phones the JSON actions live in the "More actions" menu.
await page.getByRole('button',{name:'More actions'}).click();
assert.ok(await page.getByRole('button',{name:'Export JSON backup'}).isVisible());
await page.keyboard.press('Escape');
assert.equal(await page.getByRole('button',{name:'Export JSON backup'}).count(),0);
// A new visitor can start from an empty CV.
const fresh=await browser.newPage();fresh.on('pageerror',e=>errors.push(e.message));
await fresh.goto(url);await fresh.getByRole('button',{name:/Start from scratch/}).click();await fresh.waitForTimeout(300);
const blank=await fresh.evaluate(()=>JSON.parse(localStorage.getItem('cv-builder-data')));
assert.equal(blank.personal.fullName,'');assert.equal(blank.experience[0].role,'');
await fresh.reload();assert.equal(await fresh.getByRole('dialog').count(),0,'welcome dialog only on first visit');
// Date picker writes plain text dates; bullets stay one line.
await fresh.getByLabel('Start date month').first().selectOption({label:'Sep'});
await fresh.getByLabel('Start date year').first().fill('2024');
await fresh.getByLabel('Bullet 1').first().fill('Built a tool\nused by 50 people');
await fresh.waitForTimeout(300);
const edited=(await fresh.evaluate(()=>JSON.parse(localStorage.getItem('cv-builder-data')))).experience[0];
assert.equal(edited.startDate,'Sep 2024');
assert.equal(edited.bullets[0],'Built a tool used by 50 people');
assert.deepEqual(errors,[]);
console.log('PASS: welcome dialog, undo toast, Ctrl+Z, blank start, ATS fix link, job match, date picker, bullets, phone menu, conversion, content preservation, photo upload, reload, colour, ATS switch, invalid upload, ATS check, PDF photo/bullets, mobile view.');
} finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
