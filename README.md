# BC Auto-Filler Pro

Personal-use birth certificate helper with:

- Static frontend hosted on GitHub Pages
- Node.js + Puppeteer backend hosted on Render

## Live Setup

- Frontend: GitHub Pages
- Backend: Render Web Service

## Project Files

- `index.html` - main app page
- `login.html` - login page
- `style.css` - design and layout
- `script.js` - frontend logic
- `config.js` - API base URL config
- `server.js` - backend server and Puppeteer scraping logic
- `render.yaml` - Render deploy config
- `.puppeteerrc.cjs` - Puppeteer cache config for Render

## Local Run

Install dependencies:

```powershell
npm install
```

Start backend:

```powershell
node server.js
```

Then open `login.html` or run the frontend with a local static server.

## Deployment Notes

### GitHub Pages

- Used for frontend hosting
- Static files only

### Render

- Used for backend hosting
- Runs Puppeteer for captcha and data fetch

Important:

- `config.js` must point to the correct Render backend URL
- If Render redeploys and captcha stops working, check Render logs first

## Normal Use Expectations

For personal use a few days per week, this setup should be fine.

Possible normal behavior:

- First request after some idle time may be slow because Render free service can sleep
- Captcha may take some extra time to load after backend wakes up

## If Captcha Stops Working

Check in this order:

1. Open backend health URL:

```text
https://your-render-service.onrender.com/health
```

If it returns `{"ok":true}`, backend is running.

2. Check `config.js`

- Make sure Render URL is correct

3. Check Render logs

Common causes:

- Chrome/Puppeteer browser not found
- Render build cache issue
- Target website changed selector or structure
- Target website blocked or slowed requests

4. If needed, redeploy from Render with:

- `Clear build cache & deploy`

## Important Limitation

This app depends on `https://everify.bdris.gov.bd/`

If that site changes:

- captcha selector
- form field IDs
- page structure
- anti-bot behavior

then auto fetch may stop working and code updates will be needed.

## Git Tips

Do not upload:

- `node_modules/`

Already ignored by:

```text
.gitignore
```

## Recommended Backup

Keep these safe:

- GitHub repo
- Render service URL
- login credentials used in `server.js`
- working copy of `config.js`

## Maintenance

If the app is working, avoid unnecessary dependency changes.

Only update when:

- deployment breaks
- Puppeteer stops working
- target site changes
