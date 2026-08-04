# University Events — Campus Notice Board

A shared events board for a university's faculties: browse by list or calendar,
filter by faculty, post new events with an optional poster image, and comment
on events. Built by Chathil Malsen.

Events (including uploaded posters) are saved in the visitor's own browser
(`localStorage`), so this works as a static site with no server or database.
Note that this means each visitor sees their own posted events on their own
device/browser — it does not sync between different people's devices. If you
later want everyone to see the same shared list, you'd add a small backend or
a service like Supabase/Firebase; ask if you'd like help wiring that up.

---

## 1. Run it locally in VS Code

**Prerequisites:** install [Node.js](https://nodejs.org) (v18 or later) and
[VS Code](https://code.visualstudio.com).

1. Unzip this project folder and open it in VS Code (`File → Open Folder…`).
2. Open a terminal in VS Code: `` Terminal → New Terminal ``.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open the URL it prints (usually `http://localhost:5173`) in your browser.
   Edits you make in `src/App.jsx` will hot-reload instantly.

---

## 2. Push it to GitHub

1. Create a new empty repository on [github.com](https://github.com) (don't
   add a README, .gitignore, or license — you already have those).
2. Back in the VS Code terminal, in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: University Events site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git push -u origin main
   ```
   (Replace the URL with the one GitHub shows you after creating the repo.)

Tip: VS Code's built-in **Source Control** tab (left sidebar) can do all of
this with buttons instead of the terminal, if you'd rather click than type.

---

## 3. Deploy it on Render

1. Go to [render.com](https://render.com) and sign in (you can sign in with
   your GitHub account).
2. Click **New → Static Site**.
3. Connect your GitHub account if prompted, then select the repository you
   just pushed.
4. Fill in the build settings:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Click **Create Static Site**. Render will build and deploy automatically.
6. After a minute or two you'll get a live URL like
   `https://university-events.onrender.com` — that's your published site.
7. From now on, every `git push` to `main` triggers a new automatic deploy.

---

## Project structure

```
university-events/
├── index.html          # HTML entry point, loads fonts
├── package.json         # dependencies + npm scripts
├── vite.config.js        # build tool config
├── tailwind.config.js    # styling config
├── postcss.config.js
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx            # the whole app (board, calendar, forms, modals)
│   └── index.css           # Tailwind + base styles
└── README.md
```

## Customizing

- **Faculties/colors:** edit the `FACULTIES` array near the top of
  `src/App.jsx`.
- **Starting/example events:** edit the `SEED_EVENTS` array in the same file
  — these only appear the first time someone visits (before they've posted
  anything in that browser).
- **Branding text/footer:** search for `"University Events"` and
  `"Created by Chathil Malsen"` in `src/App.jsx`.
