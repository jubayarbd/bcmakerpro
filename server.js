const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(bodyParser.json());

const USERS = {
    "Admin": "Admin@123",
    "jubayer": "pass@2026",
    "rubel": "bdris123"
};

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (USERS[username] && USERS[username] === password) {
        res.json({ success: true, token: "valid_auth_token_xyz" });
    } else {
        res.status(401).json({ success: false, message: "ইউজারনেম বা পাসওয়ার্ড ভুল!" });
    }
});

let browser, page;

app.get('/health', (req, res) => {
    res.json({ ok: true });
});

app.get('/get-captcha', async (req, res) => {
    try {
        if (browser) {
            await browser.close();
        }

        browser = await puppeteer.launch({
            headless: true,
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        page = await browser.newPage();

        await page.goto('https://everify.bdris.gov.bd/', { waitUntil: 'networkidle2' });

        const captchaSelector = '#CaptchaImage';
        await page.waitForSelector(captchaSelector, { timeout: 15000 });
        const element = await page.$(captchaSelector);

        const screenshot = await element.screenshot({ encoding: 'base64' });
        res.json({ captcha: `data:image/png;base64,${screenshot}` });
    } catch (error) {
        console.error('Captcha load failed:', error);
        res.status(500).json({ error: "ক্যাপচা লোড করতে সমস্যা হয়েছে।" });
    }
});

app.post('/get-data', async (req, res) => {
    const { regNum, dob, captchaAns } = req.body;

    try {
        await page.waitForSelector('#ubrn', { timeout: 10000 });

        await page.type('#ubrn', regNum);
        await page.type('#BirthDate', dob);
        await page.type('#CaptchaInputText', captchaAns);

        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

        const data = await page.evaluate(() => {
            const result = {};
            const tds = document.querySelectorAll('td');

            for (let i = 0; i < tds.length; i++) {
                const text = tds[i].innerText.trim().toUpperCase();

                if (text === 'REGISTRATION DATE') result.reg_date = tds[i + 3] ? tds[i + 3].innerText.trim() : '';
                if (text === 'REGISTRATION OFFICE') result.reg_office = tds[i + 3] ? tds[i + 3].innerText.trim() : '';
                if (text === 'ISSUANCE DATE') result.issuance_date = tds[i + 3] ? tds[i + 3].innerText.trim() : '';
                if (text === 'DATE OF BIRTH') result.dob_word = tds[i + 3] ? tds[i + 3].innerText.trim() : '';
                if (text === 'SEX') result.sex = tds[i + 3] ? tds[i + 3].innerText.trim() : '';

                if (text === 'নিবন্ধিত ব্যক্তির নাম') result.name_bn = tds[i + 1] ? tds[i + 1].innerText.trim() : '';
                if (text === 'REGISTERED PERSON NAME') result.name_en = tds[i + 1] ? tds[i + 1].innerText.trim() : '';
                if (text === 'জন্মস্থান') result.pob_bn = tds[i + 1] ? tds[i + 1].innerText.trim() : '';
                if (text === 'PLACE OF BIRTH') result.pob_en = tds[i + 1] ? tds[i + 1].innerText.trim() : '';
                if (text === 'মাতার নাম') result.mother_bn = tds[i + 1] ? tds[i + 1].innerText.trim() : '';
                if (text === "MOTHER'S NAME") result.mother_en = tds[i + 1] ? tds[i + 1].innerText.trim() : '';
                if (text === 'পিতার নাম') result.father_bn = tds[i + 1] ? tds[i + 1].innerText.trim() : '';
                if (text === "FATHER'S NAME") result.father_en = tds[i + 1] ? tds[i + 1].innerText.trim() : '';
            }

            const footerParagraph = Array.from(document.querySelectorAll('p')).find(p => /Location of the Register office/i.test(p.innerText));
            if (footerParagraph) {
                const em = footerParagraph.querySelector('em');
                const footerText = em ? em.innerText.trim() : footerParagraph.innerText.trim();
                const locationText = footerText.replace(/\.$/, '').trim();
                if (locationText) {
                    result.reg_location = locationText;
                    const locationParts = locationText.split(',').map(part => part.trim()).filter(Boolean);
                        if (!result.reg_office && locationParts.length > 0) {

        if (!data || !data.name_bn) {
            throw new Error("No record found");
        }

        await browser.close();
        res.json(data);
    } catch (error) {
        console.error('Data fetch failed:', error);
        if (browser) {
            await browser.close();
        }
        res.status(500).json({ error: "সঠিক তথ্য পাওয়া যায়নি। ক্যাপচা বা জন্মতারিখ ভুল হতে পারে।" });
    }
});

app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));
