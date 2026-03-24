require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
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

app.get('/', (req, res) => res.send(getHTML()));

// ─── Pairing Code ────────────────────────────────────────────────────────────
app.post('/pair', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.json({ error: 'Phone number required' });

  // Clean number — remove +, spaces, dashes
  phone = phone.replace(/[^0-9]/g, '');
  if (!phone.startsWith('92') && phone.startsWith('0')) {
    phone = '92' + phone.slice(1);
  }

  try {
    // Clean old session
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
      markOnlineOnConnect: false
    });

    sock.ev.on('creds.update', saveCreds);

    let codeSent = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnect } = update;

      // ✅ KEY FIX: Request pairing code ONLY when connection is "connecting" 
      // and QR is available (means socket is ready but not yet linked)
      if (qr && !codeSent) {
        codeSent = true;
        try {
          const code = await sock.requestPairingCode(phone);
          const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
          console.log(`✅ Pairing code for ${phone}: ${formatted}`);
          io.emit('pairing_code', { code: formatted, phone });
        } catch (err) {
          console.error('Pairing code error:', err.message);
          io.emit('error', { message: 'Failed to get pairing code: ' + err.message });
        }
      }

      if (connection === 'open') {
        console.log('✅ WhatsApp connected!');
        io.emit('status', { message: '✅ Connected! Generating session...' });

        await new Promise(r => setTimeout(r, 3000));
        const session = await exportSession();
        if (session) {
          io.emit('session_ready', { session });
        }
        setTimeout(() => { try { sock.end(); } catch (_) {} }, 3000);
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code !== DisconnectReason.loggedOut && !codeSent) {
          io.emit('error', { message: 'Connection closed. Please try again.' });
        }
      }
    });

    res.json({ success: true, message: `Sending pairing request to WhatsApp for ${phone}...` });

  } catch (err) {
    console.error(err);
    res.json({ error: err.message });
  }
});

// ─── QR Code ─────────────────────────────────────────────────────────────────
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
      markOnlineOnConnect: false
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
        setTimeout(() => { try { sock.end(); } catch (_) {} }, 3000);
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ─── Export Session ───────────────────────────────────────────────────────────
async function exportSession() {
  try {
    const credsPath = path.join(TEMP, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;
    const creds = fs.readFileSync(credsPath, 'utf-8');
    return `Gifted~${Buffer.from(creds).toString('base64')}`;
  } catch (_) { return null; }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🌐 Companion site on port ${PORT}`));

// ─── HTML ─────────────────────────────────────────────────────────────────────
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
  button:hover{opacity:.9}
  button:disabled{opacity:.5;cursor:not-allowed}
  .result{background:#091640;border:1px solid #1e3a8a;border-radius:8px;padding:16px;margin-top:16px}
  .code{font-size:2.2rem;font-weight:700;color:#42a5f5;letter-spacing:6px;text-align:center;margin:10px 0;font-family:monospace}
  .session-box{background:#050d30;border:1px solid #0d47a1;border-radius:8px;padding:12px;font-size:.75rem;color:#90caf9;word-break:break-all;max-height:100px;overflow-y:auto;margin-top:8px}
  #qrImg{width:220px;height:220px;display:block;margin:10px auto;border-radius:8px}
  .step{color:#90caf9;font-size:.85rem;margin-bottom:8px;padding-left:10px;border-left:2px solid #1565c0}
  .success{color:#4caf50;font-weight:600;text-align:center;margin-top:10px;font-size:1rem}
  .error{color:#f44336;font-weight:600;text-align:center;margin-top:10px}
  .hidden{display:none}
  .copy-btn{background:#0d47a1;padding:8px;font-size:.8rem;margin-top:8px}
  .status{color:#ffb74d;text-align:center;font-size:.85rem;margin-top:8px}
  .spinner{display:inline-block;width:16px;height:16px;border:2px solid #42a5f5;border-top-color:transparent;border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle;margin-right:6px}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="header">
  <h1>🇵🇰 Pakistan Jobs Bot</h1>
  <p>Get your SESSION_ID to deploy the bot on Heroku</p>
</div>

<div class="tabs">
  <div class="tab active" onclick="showTab('pair')">📱 Pairing Code</div>
  <div class="tab" onclick="showTab('qr')">📷 QR Code</div>
</div>

<!-- Pairing Tab -->
<div class="box" id="tab-pair">
  <p class="step">1. Enter your WhatsApp number with country code (no + sign)</p>
  <p class="step">2. Click Get Code — wait for notification on WhatsApp</p>
  <p class="step">3. Go to WhatsApp → Linked Devices → Link a Device → Link with phone number</p>
  <p class="step">4. Enter the 8-digit code shown below</p>
  <br>
  <input type="text" id="phoneInput" placeholder="e.g. 923477262704" />
  <button id="pairBtn" onclick="getPairCode()">📲 Get Pairing Code</button>
  <div id="pairStatus" class="status hidden"></div>
  <div id="pairResult" class="result hidden">
    <p style="color:#90caf9;text-align:center;font-size:.85rem">Enter this code in WhatsApp:</p>
    <div class="code" id="pairCode">----</div>
    <p style="color:#ffb74d;text-align:center;font-size:.78rem">Code expires in ~60 seconds. Enter it quickly!</p>
  </div>
</div>

<!-- QR Tab -->
<div class="box hidden" id="tab-qr">
  <p class="step">1. Click Generate QR Code</p>
  <p class="step">2. Open WhatsApp → Linked Devices → Link a Device</p>
  <p class="step">3. Scan the QR code (acts like WhatsApp Web)</p>
  <br>
  <button onclick="startQR()">📷 Generate QR Code</button>
  <div id="qrResult" class="result hidden">
    <img id="qrImg" src="" alt="QR Code" />
    <p class="status">Scan with WhatsApp now — QR refreshes every 20 seconds</p>
  </div>
</div>

<!-- Session Result -->
<div class="box hidden" id="sessionBox">
  <p class="success">✅ Session Generated Successfully!</p>
  <p style="color:#90caf9;font-size:.82rem;margin-top:8px">Copy this SESSION_ID and paste in Heroku Config Vars:</p>
  <div class="session-box" id="sessionStr"></div>
  <button class="copy-btn" onclick="copySession()">📋 Copy SESSION_ID</button>
  <p style="color:#4caf50;font-size:.78rem;margin-top:10px;text-align:center">
    Heroku → Main Bot App → Settings → Config Vars → SESSION_ID
  </p>
</div>

<div class="box hidden" id="errorBox">
  <p class="error" id="errorMsg"></p>
  <button onclick="location.reload()">🔄 Try Again</button>
</div>

<script>
const socket = io();

function showTab(name) {
  ['pair','qr'].forEach(t => {
    document.getElementById('tab-'+t).classList.toggle('hidden', t !== name);
  });
  document.querySelectorAll('.tab').forEach((el,i) => {
    el.classList.toggle('active', ['pair','qr'][i] === name);
  });
}

async function getPairCode() {
  let phone = document.getElementById('phoneInput').value.replace(/[^0-9]/g,'');
  if (!phone || phone.length < 10) return alert('Enter valid phone number with country code\\ne.g. 923477262704');

  const btn = document.getElementById('pairBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending request to WhatsApp...';

  const status = document.getElementById('pairStatus');
  status.classList.remove('hidden');
  status.innerHTML = '<span class="spinner"></span> Connecting to WhatsApp servers...';

  try {
    const res = await fetch('/pair', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (data.error) {
      showError(data.error);
      btn.disabled = false;
      btn.innerHTML = '📲 Get Pairing Code';
      return;
    }
    status.innerHTML = '<span class="spinner"></span> Waiting for pairing code from WhatsApp...';
  } catch(err) {
    showError(err.message);
    btn.disabled = false;
    btn.innerHTML = '📲 Get Pairing Code';
  }
}

async function startQR() {
  document.getElementById('qrResult').classList.remove('hidden');
  await fetch('/qr-start');
}

socket.on('pairing_code', ({ code, phone }) => {
  document.getElementById('pairCode').textContent = code;
  document.getElementById('pairResult').classList.remove('hidden');
  document.getElementById('pairStatus').innerHTML = '✅ Code ready! Enter it in WhatsApp now.';
  document.getElementById('pairBtn').disabled = false;
  document.getElementById('pairBtn').innerHTML = '📲 Get Pairing Code';
});

socket.on('qr', ({ image }) => {
  document.getElementById('qrImg').src = image;
  document.getElementById('qrResult').classList.remove('hidden');
});

socket.on('status', ({ message }) => {
  document.getElementById('pairStatus').innerHTML = message;
  document.getElementById('pairStatus').classList.remove('hidden');
});

socket.on('session_ready', ({ session }) => {
  document.getElementById('sessionStr').textContent = session;
  document.getElementById('sessionBox').classList.remove('hidden');
  document.getElementById('pairResult').classList.add('hidden');
});

socket.on('error', ({ message }) => {
  showError(message);
  document.getElementById('pairBtn').disabled = false;
  document.getElementById('pairBtn').innerHTML = '📲 Get Pairing Code';
});

function showError(msg) {
  document.getElementById('errorMsg').textContent = '❌ ' + msg;
  document.getElementById('errorBox').classList.remove('hidden');
}

function copySession() {
  const text = document.getElementById('sessionStr').textContent;
  navigator.clipboard.writeText(text).then(() => alert('✅ SESSION_ID copied! Now paste it in Heroku Config Vars.'));
}
</script>
</body>
</html>`;
}
