require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TEMP = path.join(__dirname, '../temp_session');

// ✅ KEEP HTML ROUTE (your frontend depends on it)
app.get('/', (req, res) => res.send(getHTML()));


// ─────────────────────────────────────────
// 📱 PAIRING CODE (FIXED PROPERLY)
// ─────────────────────────────────────────
app.post('/pair', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.json({ error: 'Phone number required' });

  phone = phone.replace(/[^0-9]/g, '');
  if (!phone.startsWith('92') && phone.startsWith('0')) {
    phone = '92' + phone.slice(1);
  }

  try {
    // clean old session
    if (fs.existsSync(TEMP)) fs.rmSync(TEMP, { recursive: true, force: true });
    fs.mkdirSync(TEMP, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(TEMP);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '120.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    let codeSent = false;

    sock.ev.on('connection.update', async (update) => {
      console.log('Connection:', update);

      const { connection, lastDisconnect } = update;

      // ✅ correct trigger
      if (connection === 'connecting' && !codeSent) {
        codeSent = true;

        try {
          const code = await sock.requestPairingCode(phone);
          const formatted = code?.match(/.{1,4}/g)?.join('-') || code;

          io.emit('pairing_code', { code: formatted, phone });
        } catch (err) {
          io.emit('error', { message: err.message });
        }
      }

      if (connection === 'open') {
        io.emit('status', { message: '✅ Connected! Generating session...' });

        await new Promise(r => setTimeout(r, 3000));

        const session = await exportSession();
        if (session) io.emit('session_ready', { session });

        setTimeout(() => {
          try { sock.end(); } catch (_) {}
        }, 3000);
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log('Disconnected:', code);

        if (code !== DisconnectReason.loggedOut) {
          io.emit('error', { message: 'Connection closed. Try again.' });
        }
      }
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.json({ error: err.message });
  }
});


// ─────────────────────────────────────────
// 📷 QR FLOW (kept stable)
// ─────────────────────────────────────────
app.get('/qr-start', async (req, res) => {
  try {
    if (fs.existsSync(TEMP)) fs.rmSync(TEMP, { recursive: true, force: true });
    fs.mkdirSync(TEMP, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(TEMP);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '120.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr } = update;

      if (qr) {
        const qrImage = await QRCode.toDataURL(qr);
        io.emit('qr', { image: qrImage });
      }

      if (connection === 'open') {
        io.emit('status', { message: '✅ Connected! Generating session...' });

        await new Promise(r => setTimeout(r, 3000));

        const session = await exportSession();
        if (session) io.emit('session_ready', { session });

        setTimeout(() => {
          try { sock.end(); } catch (_) {}
        }, 3000);
      }
    });

    res.json({ success: true });

  } catch (err) {
    res.json({ error: err.message });
  }
});


// ─────────────────────────────────────────
// 🔐 EXPORT SESSION
// ─────────────────────────────────────────
async function exportSession() {
  try {
    const credsPath = path.join(TEMP, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;

    const creds = fs.readFileSync(credsPath, 'utf-8');
    return `Gifted~${Buffer.from(creds).toString('base64')}`;
  } catch (err) {
    console.error(err);
    return null;
  }
}


// ─────────────────────────────────────────
// 🚀 START SERVER
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🌐 Server running on ${PORT}`));


// ─────────────────────────────────────────
// 🌐 HTML (REQUIRED — DO NOT REMOVE)
// ─────────────────────────────────────────
function getHTML() {
  return `<h2 style="text-align:center;margin-top:40px;">✅ Companion Server Running</h2>`;
      }          io.emit('error', { message: 'Connection closed. Try again.' });
        }
      }
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// 📷 QR FLOW (UNCHANGED BUT CLEANED)
// ─────────────────────────────────────────────────────────
app.get('/qr-start', async (req, res) => {
  try {
    if (fs.existsSync(TEMP)) fs.rmSync(TEMP, { recursive: true, force: true });
    fs.mkdirSync(TEMP, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(TEMP);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu', 'Chrome', '120.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      console.log('QR update:', update);

      const { connection, qr } = update;

      if (qr) {
        const qrImage = await QRCode.toDataURL(qr);
        io.emit('qr', { image: qrImage });
      }

      if (connection === 'open') {
        io.emit('status', { message: '✅ Connected! Generating session...' });

        await new Promise(r => setTimeout(r, 3000));

        const session = await exportSession();
        if (session) io.emit('session_ready', { session });

        setTimeout(() => {
          try { sock.end(); } catch (_) {}
        }, 3000);
      }
    });

    res.json({ success: true });

  } catch (err) {
    res.json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// 🔐 EXPORT SESSION
// ─────────────────────────────────────────────────────────
async function exportSession() {
  try {
    const credsPath = path.join(TEMP, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;

    const creds = fs.readFileSync(credsPath, 'utf-8');
    return `Gifted~${Buffer.from(creds).toString('base64')}`;

  } catch (err) {
    console.error('Export error:', err.message);
    return null;
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🌐 Server running on ${PORT}`));    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Pakistan Jobs Bot', 'Chrome', '120.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;
    if (qr) {
      const qrImage = await QRCode.toDataURL(qr);
      io.emit('qr', { image: qrImage });
    }
    if (connection === 'open') {
      await new Promise(r => setTimeout(r, 3000));
      const sessionStr = await exportSession();
      io.emit('session_ready', { session: sessionStr });
      setTimeout(() => { try { sock.end(); } catch (_) {} }, 5000);
    }
  });
}

async function exportSession() {
  try {
    const credsPath = path.join(SESSION_TEMP, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;
    const creds = fs.readFileSync(credsPath, 'utf-8');
    const encoded = Buffer.from(creds).toString('base64');
    return `Gifted~${encoded}`;
  } catch (err) {
    return null;
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🌐 Companion site on port ${PORT}`));

function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>🇵🇰 Pakistan Jobs Bot — Get Session</title>
<script src="/socket.io/socket.io.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;background:#0a0e2e;color:#e0e8ff;min-height:100vh;display:flex;flex-direction:column;align-items:center}
  .header{background:linear-gradient(135deg,#1a237e,#1565c0);width:100%;padding:20px;text-align:center}
  .header h1{font-size:1.6rem;color:#fff}
  .header p{color:#90caf9;margin-top:4px;font-size:.9rem}
  .tabs{display:flex;gap:0;margin:30px 0 0;background:#0d1b4b;border-radius:12px;overflow:hidden;border:1px solid #1e3a8a}
  .tab{padding:12px 30px;cursor:pointer;font-size:.9rem;color:#90caf9;transition:.2s}
  .tab.active{background:#1565c0;color:#fff}
  .box{background:#0d1b4b;border:1px solid #1e3a8a;border-radius:12px;padding:30px;width:100%;max-width:500px;margin:20px}
  input{width:100%;padding:12px;background:#091640;border:1px solid #1e3a8a;border-radius:8px;color:#e0e8ff;font-size:1rem;margin-bottom:12px}
  button{width:100%;padding:12px;background:linear-gradient(135deg,#1565c0,#0d47a1);border:none;border-radius:8px;color:#fff;font-size:1rem;cursor:pointer;font-weight:600}
  button:hover{background:linear-gradient(135deg,#1976d2,#1565c0)}
  .result{background:#091640;border:1px solid #1e3a8a;border-radius:8px;padding:16px;margin-top:16px;display:none}
  .code{font-size:2rem;font-weight:700;color:#42a5f5;letter-spacing:4px;text-align:center;margin:10px 0}
  .session-box{background:#050d30;border:1px solid #0d47a1;border-radius:8px;padding:12px;font-size:.75rem;color:#90caf9;word-break:break-all;max-height:100px;overflow-y:auto}
  #qrImg{width:200px;height:200px;display:block;margin:10px auto;border-radius:8px}
  .step{color:#90caf9;font-size:.85rem;margin-bottom:6px;padding-left:10px;border-left:2px solid #1565c0}
  .success{color:#4caf50;font-weight:600;text-align:center;margin-top:10px}
  .hidden{display:none}
  .copy-btn{background:#0d47a1;padding:8px;font-size:.8rem;margin-top:8px}
</style>
</head>
<body>
<div class="header">
  <h1>🇵🇰 Pakistan Jobs Bot</h1>
  <p>Get your SESSION_ID to deploy the bot</p>
</div>

<div class="tabs">
  <div class="tab active" onclick="showTab('pair')">📱 Pairing Code</div>
  <div class="tab" onclick="showTab('qr')">📷 QR Code</div>
  <div class="tab" onclick="showTab('manual')">🔑 Session ID</div>
</div>

<!-- Pairing Tab -->
<div class="box" id="tab-pair">
  <p class="step">1. Enter your WhatsApp number with country code</p>
  <p class="step">2. Open WhatsApp → Linked Devices → Link with phone number</p>
  <p class="step">3. Enter the 8-digit code shown below</p>
  <br>
  <input type="text" id="phoneInput" placeholder="e.g. 923001234567" />
  <button onclick="getPairCode()">Get Pairing Code</button>
  <div class="result" id="pairResult">
    <p style="color:#90caf9;text-align:center;font-size:.85rem">Your pairing code:</p>
    <div class="code" id="pairCode">----</div>
    <p id="pairStatus" style="color:#ffb74d;text-align:center;font-size:.82rem">Waiting for WhatsApp connection...</p>
  </div>
</div>

<!-- QR Tab -->
<div class="box hidden" id="tab-qr">
  <p class="step">1. Click Generate QR</p>
  <p class="step">2. Open WhatsApp → Linked Devices → Link a device</p>
  <p class="step">3. Scan the QR code</p>
  <br>
  <button onclick="getQR()">Generate QR Code</button>
  <div class="result" id="qrResult">
    <img id="qrImg" src="" alt="QR Code" />
    <p style="color:#90caf9;text-align:center;font-size:.82rem">Scan with WhatsApp</p>
  </div>
</div>

<!-- Manual Tab -->
<div class="box hidden" id="tab-manual">
  <p class="step">Already have a session? Paste it in Heroku config vars:</p>
  <br>
  <p style="color:#42a5f5;font-size:.9rem;margin-bottom:8px">Heroku → Settings → Config Vars → SESSION_ID</p>
  <p style="color:#90caf9;font-size:.82rem">Format: <code style="color:#ffb74d">Gifted~base64data...</code></p>
</div>

<!-- Session Result (shown after any auth method) -->
<div class="box hidden" id="sessionBox">
  <p class="success">✅ Connected! Copy your SESSION_ID below:</p>
  <div class="session-box" id="sessionStr">-</div>
  <button class="copy-btn" onclick="copySession()">📋 Copy SESSION_ID</button>
  <p style="color:#90caf9;font-size:.78rem;margin-top:10px;text-align:center">Paste this in Heroku → Settings → Config Vars → SESSION_ID</p>
</div>

<script>
const socket = io();

function showTab(name) {
  ['pair','qr','manual'].forEach(t => {
    document.getElementById('tab-'+t).classList.toggle('hidden', t !== name);
  });
  document.querySelectorAll('.tab').forEach((el,i) => {
    el.classList.toggle('active', ['pair','qr','manual'][i] === name);
  });
}

async function getPairCode() {
  const phone = document.getElementById('phoneInput').value.replace(/[^0-9]/g,'');
  if (!phone || phone.length < 10) return alert('Enter valid phone number');
  const res = await fetch('/pair', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone }) });
  const data = await res.json();
  if (data.error) return alert(data.error);
  document.getElementById('pairCode').textContent = data.code;
  document.getElementById('pairResult').style.display = 'block';
}

async function getQR() {
  await fetch('/qr');
  document.getElementById('qrResult').style.display = 'block';
}

socket.on('qr', ({ image }) => {
  document.getElementById('qrImg').src = image;
});

socket.on('pairing_code', ({ code }) => {
  document.getElementById('pairCode').textContent = code;
  document.getElementById('pairStatus').textContent = 'Enter this code in WhatsApp now...';
  document.getElementById('pairResult').style.display = 'block';
});

socket.on('session_ready', ({ session }) => {
  if (!session) return;
  document.getElementById('sessionStr').textContent = session;
  document.getElementById('sessionBox').classList.remove('hidden');
  document.getElementById('pairStatus') && (document.getElementById('pairStatus').textContent = '✅ Session generated!');
});

function copySession() {
  const text = document.getElementById('sessionStr').textContent;
  navigator.clipboard.writeText(text).then(() => alert('✅ SESSION_ID copied!'));
}
</script>
</body>
</html>`;
}
