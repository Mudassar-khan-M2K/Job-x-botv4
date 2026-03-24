<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=32&pause=1000&color=25D366&center=true&vCenter=true&width=600&lines=🇵🇰+Pakistan+Jobs+Bot+v4.0;WhatsApp+Automation+Bot;30+Sources+%7C+Auto+Posts+24%2F7;Govt+%7C+Defence+%7C+Private+Jobs" alt="Typing SVG" />

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-WhatsApp_API-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Heroku](https://img.shields.io/badge/Heroku-Deploy-430098?style=for-the-badge&logo=heroku&logoColor=white)](https://heroku.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br/>

![Pakistan Flag](https://img.shields.io/badge/Made%20for-Pakistan%20🇵🇰-009A44?style=flat-square)
![Version](https://img.shields.io/badge/Version-4.0.0-blue?style=flat-square)
![Sources](https://img.shields.io/badge/Job%20Sources-30-orange?style=flat-square)
![Auto Post](https://img.shields.io/badge/Auto%20Post-Every%2020%20min-red?style=flat-square)

</div>

---

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

## 📌 What is this?

> **Pakistan Jobs Bot** is a fully automated WhatsApp bot that scrapes **30 job sources** every 20 minutes and posts them to your WhatsApp channel — covering Government, Defence, and Private sector jobs across Pakistan.

- 🔄 **Auto-posts** 1 job every 20 minutes to your WhatsApp channel — no commands needed
- 🤖 **Responds** to job commands in any chat — private, group, or channel
- 📊 **Live dashboard** shows real-time stats at your Heroku URL
- 🔐 **Session-based auth** — no QR scan needed on server
- 🚨 **Crash alerts** sent instantly to your WhatsApp

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 Bot
- Works in **private chats, groups & channels**
- Replies to **any user, anywhere**
- Only responds to **whitelisted commands**
- **Zero spam** — silent on non-commands
- **Auto reconnect** with exponential backoff

</td>
<td width="50%">

### 📡 Scraping
- **30 job sources** scraped simultaneously
- `p-limit(5)` concurrency control
- Per-scraper **10s timeout** protection
- **Failure isolation** — 1 fail ≠ system crash
- **Duplicate guard** via SQLite hash IDs

</td>
</tr>
<tr>
<td width="50%">

### 📢 Channel
- Auto-posts to `@newsletter` JID
- Full job info — org, location, salary, deadline
- Labeled: 🏛️ Govt / ⚔️ Defence / 🏢 Private
- **Never repeats** a job
- Random delay (18–25 min) for WhatsApp safety

</td>
<td width="50%">

### 📊 Dashboard
- Live **blue UI** at your Heroku URL
- Real-time via **Socket.IO** — no refresh needed
- Command logs — who, what, when, where
- Per-source job counts
- Memory + uptime + error tracking

</td>
</tr>
</table>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

## 📡 30 Job Sources

<details>
<summary><b>🏛️ Government Sources (12) — click to expand</b></summary>
<br/>

| # | Source | Website |
|---|--------|---------|
| 1 | NJP Portal | njp.gov.pk |
| 2 | FPSC | fpsc.gov.pk |
| 3 | PPSC | ppsc.gop.pk |
| 4 | SPSC | spsc.gos.pk |
| 5 | NADRA | nadra.gov.pk |
| 6 | PAEC | paec.gov.pk |
| 7 | HEC | hec.gov.pk |
| 8 | FBR | fbr.gov.pk |
| 9 | WAPDA | wapda.gov.pk |
| 10 | PIA | piac.com.pk |
| 11 | Pakistan Railways | railways.gov.pk |
| 12 | Punjab Govt | jobs.punjab.gov.pk |

</details>

<details>
<summary><b>⚔️ Defence Sources (5) — click to expand</b></summary>
<br/>

| # | Source | Website |
|---|--------|---------|
| 1 | Pakistan Army | joinpakarmy.gov.pk |
| 2 | Pakistan Navy | joinpaknavy.gov.pk |
| 3 | Pakistan Air Force | paf.gov.pk |
| 4 | ANF | anf.gov.pk |
| 5 | Pakistan Rangers | pakistanrangers.gov.pk |

</details>

<details>
<summary><b>🏢 Private Sources (13) — click to expand</b></summary>
<br/>

| # | Source | Website |
|---|--------|---------|
| 1 | Rozee.pk | rozee.pk |
| 2 | Mustakbil | mustakbil.com |
| 3 | Bayt | bayt.com |
| 4 | Engro Corporation | engroholdingscareers.com |
| 5 | PSO | psopk.com |
| 6 | HBL Bank | hbl.com |
| 7 | MCB Bank | mcb.com.pk |
| 8 | Unilever Pakistan | careers.unilever.com |
| 9 | Nestle Pakistan | nestle.com.pk |
| 10 | PTCL | ptcl.com.pk |
| 11 | SNGPL | sngpl.com.pk |
| 12 | Telenor | telenor.com.pk |
| 13 | Jazz | jazz.com.pk |

</details>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

## ⌨️ Commands

> Bot responds to **anyone, anywhere** — private, group, or channel.

<details>
<summary><b>View All 25 Commands — click to expand</b></summary>
<br/>

| Command | Description |
|---------|-------------|
| `!ping` / `!alive` | Bot status & speed |
| `!help` / `!menu` | Full command list |
| `!all` | All recent jobs |
| `!govt` | Government jobs |
| `!defence` | Defence jobs |
| `!private` | Private jobs |
| `!army` | Pakistan Army |
| `!navy` | Pakistan Navy |
| `!paf` | PAF jobs |
| `!anf` | ANF jobs |
| `!rangers` | Rangers jobs |
| `!njp` | NJP Portal |
| `!fpsc` | FPSC |
| `!ppsc` | PPSC |
| `!nadra` | NADRA |
| `!paec` | Atomic Energy |
| `!hec` | HEC |
| `!fbr` | FBR |
| `!wapda` | WAPDA |
| `!matric` | Matric-level jobs |
| `!inter` | Intermediate-level jobs |
| `!bs` | BS/BA degree jobs |
| `!ms` | MS/MBA degree jobs |
| `!stats` | Bot statistics |
| `!about` | Developer info |

</details>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

## 🚀 Deployment

### Step 1 — Get Session ID

```bash
# Deploy companion pairing site (separate app)
heroku create your-pairing-site
heroku buildpacks:add -a your-pairing-site heroku-community/multi-procfile
heroku config:set -a your-pairing-site PROCFILE=companion/Procfile
git remote add pairing https://git.heroku.com/your-pairing-site.git
git push pairing main
```

Open `https://your-pairing-site.herokuapp.com`
→ Enter phone number → Get pairing code → Link in WhatsApp → Copy SESSION_ID

---

### Step 2 — Deploy Main Bot

```bash
git init
git add .
git commit -m "🇵🇰 Pakistan Jobs Bot v4.0"

heroku create your-bot-name
git remote add heroku https://git.heroku.com/your-bot-name.git

heroku config:set SESSION_ID="Gifted~your_session_here" -a your-bot-name
heroku config:set NODE_ENV=production -a your-bot-name

git push heroku main
heroku logs --tail -a your-bot-name
```

✅ **Dashboard:** `https://your-bot-name.herokuapp.com`

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

## 🏗️ Project Structure

```
pakistan-jobs-bot/
│
├── 📄 Procfile                    → Heroku: runs bot + dashboard
├── 📄 app.json                    → Heroku deploy config
├── 📄 package.json                → All dependencies
│
├── 📁 config/
│   ├── config.js                  → Owner JIDs, channel JID, intervals
│   ├── logger.js                  → Pino fast logger
│   └── state.js                   → Shared connection state
│
├── 📁 bot/
│   ├── index.js                   → Entry point
│   ├── connection.js              → Baileys + session + auto-reconnect
│   ├── commandHandler.js          → Listens all, fires whitelisted only
│   ├── scheduler.js               → Scrape (20min) + Send (8min) cycles
│   ├── alerts.js                  → Crash/error → all 4 owners
│   └── 📁 commands/
│       ├── ping.js  help.js  jobs.js  stats.js  about.js
│
├── 📁 scrapers/
│   ├── base.js                    → axios, cheerio, timeout, hash ID
│   ├── scrapeManager.js           → p-limit(5) orchestrator
│   ├── 📁 govt/                   → 12 scrapers
│   ├── 📁 defence/                → 5 scrapers
│   └── 📁 private/                → 13 scrapers
│
├── 📁 database/
│   └── db.js                      → SQLite — auto-creates on first run
│
├── 📁 dashboard/
│   └── server.js                  → Express + Socket.IO live UI
│
└── 📁 companion/
    ├── Procfile                   → Separate Heroku app
    └── server.js                  → QR + Pairing + Session export
```

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_ID` | ✅ | WhatsApp session from companion site |
| `NODE_ENV` | ✅ | Set to `production` |
| `PORT` | Auto | Set automatically by Heroku |

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

## 🔐 System Architecture

```
┌──────────────────────────────────────────────┐
│               HEROKU DYNO (Main)             │
│                                              │
│   ┌─────────────┐      ┌─────────────────┐  │
│   │ Bot Process │◄────►│ Dashboard (3000)│  │
│   │  (Baileys)  │      │  Express+SIO    │  │
│   └──────┬──────┘      └─────────────────┘  │
│          │                                   │
│   ┌──────▼──────┐      ┌─────────────────┐  │
│   │  Scheduler  │◄────►│   SQLite DB     │  │
│   │ Scrape+Send │      │   jobs.db       │  │
│   └─────────────┘      └─────────────────┘  │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│          HEROKU DYNO (Companion)             │
│     QR + Pairing Code + Session Export       │
└──────────────────────────────────────────────┘
```

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<div align="center">

## 👨‍💻 Developer

**Mudassar Khan**

[![WhatsApp](https://img.shields.io/badge/WhatsApp-%2B92_347_7262704-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/923477262704)

<br/>

![Footer](https://img.shields.io/badge/🇵🇰_Made_with_❤️_for_Pakistan-009A44?style=for-the-badge)

<br/>

*If this helped you, drop a ⭐ — it means a lot!*

</div>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />
