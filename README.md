# 🇵🇰 Pakistan Jobs Bot v4.0

> Developed by **Mudassar Khan** | 📲 +92 347 7262704

Auto-posts Pakistan govt, defence & private jobs to WhatsApp every 20 minutes.

---

## 🚀 Deployment Guide

### STEP 1 — Get Your SESSION_ID

1. Deploy the **Companion Site** first (separate app):
```bash
heroku create your-pairing-site
heroku buildpacks:add -a your-pairing-site heroku-community/multi-procfile
heroku config:set -a your-pairing-site PROCFILE=companion/Procfile
git remote add pairing https://git.heroku.com/your-pairing-site.git
git push pairing main
```

2. Open: `https://your-pairing-site.herokuapp.com`
3. Enter your WhatsApp number → get pairing code → link in WhatsApp
4. Copy the SESSION_ID shown

---

### STEP 2 — Deploy Main Bot

```bash
git init
git add .
git commit -m "Pakistan Jobs Bot v4.0"

# Create main bot app
heroku create your-bot-name
git remote add heroku https://git.heroku.com/your-bot-name.git

# Set environment variables
heroku config:set SESSION_ID="Gifted~your_session_here" -a your-bot-name
heroku config:set NODE_ENV=production -a your-bot-name

# Deploy
git push heroku main
heroku logs --tail -a your-bot-name
```

3. Dashboard: `https://your-bot-name.herokuapp.com`

---

## ⌨️ Commands

| Command | Description |
|---------|-------------|
| `!ping` / `!alive` | Bot status |
| `!help` / `!menu` | All commands |
| `!all` | Today's all jobs |
| `!govt` | Government jobs |
| `!defence` | Defence jobs |
| `!private` | Private jobs |
| `!army` `!navy` `!paf` `!anf` `!rangers` | Defence sources |
| `!njp` `!fpsc` `!ppsc` `!nadra` etc | Specific sources |
| `!matric` `!inter` `!bs` `!ms` | Education filter |
| `!stats` | Bot statistics |
| `!about` | Developer info |

---

## 📡 30 Job Sources

**🏛️ Government (12):** NJP, FPSC, PPSC, SPSC, NADRA, PAEC, HEC, FBR, WAPDA, PIA, Railways, Punjab Govt

**⚔️ Defence (5):** Army, Navy, PAF, ANF, Rangers

**🏢 Private (13):** Rozee, Mustakbil, Bayt, Engro, PSO, HBL, MCB, Unilever, Nestle, PTCL, SNGPL, Telenor, Jazz

## Bot + Pair web Structure 



```
pakistan-jobs-bot/
│
├── 📄 Procfile                          → Heroku: runs bot + dashboard together
├── 📄 app.json                          → Heroku deploy config
├── 📄 package.json                      → All dependencies
├── 📄 .env.example                      → Environment variables template
├── 📄 .gitignore                        → Ignores node_modules, session, logs
├── 📄 README.md                         → Full deployment guide
│
├── 📁 config/
│   ├── config.js                        → Central settings (owners, channel JID, intervals)
│   ├── logger.js                        → Pino logger setup
│   └── state.js                         → Shared isConnected flag (bot ↔ dashboard)
│
├── 📁 bot/
│   ├── index.js                         → Main entry point — starts everything
│   ├── connection.js                    → Baileys WhatsApp connect + session + reconnect
│   ├── commandHandler.js                → Listens ALL messages, only fires whitelisted cmds
│   ├── scheduler.js                     → Dual cycle: scrape every 20min, send every 8min
│   ├── alerts.js                        → Error/crash alerts → all 4 owner numbers
│   │
│   └── 📁 commands/
│       ├── ping.js                      → !ping / !alive
│       ├── help.js                      → !help / !menu
│       ├── jobs.js                      → !all !govt !defence !private + source/edu filters
│       ├── stats.js                     → !stats
│       └── about.js                     → !about / !sources
│
├── 📁 scrapers/
│   ├── base.js                          → Shared: axios, cheerio, timeout, buildJob, hash ID
│   ├── scrapeManager.js                 → Runs all 30 scrapers with p-limit(5) concurrency
│   │
│   ├── 📁 govt/                         → 12 Government sources
│   │   ├── njp.js                       → njp.gov.pk
│   │   ├── fpsc.js                      → fpsc.gov.pk
│   │   ├── ppsc.js                      → ppsc.gop.pk
│   │   ├── spsc.js                      → spsc.gos.pk
│   │   ├── nadra.js                     → nadra.gov.pk
│   │   ├── paec.js                      → paec.gov.pk
│   │   ├── hec.js                       → hec.gov.pk
│   │   ├── fbr.js                       → fbr.gov.pk
│   │   ├── wapda.js                     → wapda.gov.pk
│   │   ├── pia.js                       → piac.com.pk
│   │   ├── railways.js                  → railways.gov.pk
│   │   └── punjab.js                    → jobs.punjab.gov.pk
│   │
│   ├── 📁 defence/                      → 5 Defence sources
│   │   ├── army.js                      → joinpakarmy.gov.pk
│   │   ├── navy.js                      → joinpaknavy.gov.pk
│   │   ├── paf.js                       → paf.gov.pk
│   │   ├── anf.js                       → anf.gov.pk
│   │   └── rangers.js                   → pakistanrangers.gov.pk
│   │
│   └── 📁 private/                      → 13 Private sources
│       ├── rozee.js                     → rozee.pk
│       ├── mustakbil.js                 → mustakbil.com
│       ├── bayt.js                      → bayt.com
│       ├── engro.js                     → engroholdingscareers.com
│       ├── pso.js                       → psopk.com
│       ├── hbl.js                       → hbl.com
│       ├── mcb.js                       → mcb.com.pk
│       ├── unilever.js                  → careers.unilever.com
│       ├── nestle.js                    → nestle.com.pk
│       ├── ptcl.js                      → ptcl.com.pk
│       ├── sngpl.js                     → sngpl.com.pk
│       ├── telenor.js                   → telenor.com.pk
│       └── jazz.js                      → jazz.com.pk
│
├── 📁 database/
│   └── db.js                            → SQLite: jobs, cmd_logs, stats, errors tables
│
├── 📁 dashboard/
│   └── server.js                        → Express + Socket.IO blue UI dashboard
│
└── 📁 companion/                        → SEPARATE Heroku app
    ├── Procfile                         → Runs companion only
    └── server.js                        → QR + Pairing Code + Session ID generator
```

---

**Totals:**
- 📄 **56 files** total
- 🤖 **30 scrapers** (12 govt + 5 defence + 13 private)
- ⌨️ **23 commands** handled
- 🏗️ **2 Heroku apps** from 1 repo
---

## 📦 Environment Variables

| Variable | Description |
|----------|-------------|
| `SESSION_ID` | WhatsApp session (from companion site) |
| `NODE_ENV` | Set to `production` |
| `PORT` | Dashboard port (auto on Heroku) |

---

## 👨‍💻 Developer
**Mudassar Khan** | 📲 +92 347 7262704 | 🇵🇰 Made with ❤️ for Pakistan
