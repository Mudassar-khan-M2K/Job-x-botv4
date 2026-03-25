require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
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

// Pairing Code Route
app.post('/pair', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.json({ error: 'Phone number required' });

  phone = phone.replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) phone = '92' + phone.slice(1);
  if (!phone.startsWith('92')) phone = '92' + phone;

  res.json({ success: true });

  try {
    if (fs.existsSync(TEMP)) fs.rmSync(TEMP, { recursive: true, force: true });
    fs.mkdirSync(TEMP, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(TEMP);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
      },
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
      logger: pino({ level: 'silent' }),
      markOnlineOnConnect: false
    });

    sock.ev.on('creds.update', saveCreds);

    let codeSent = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr && !codeSent) {
        codeSent = true;
        try {
          const code = await sock.requestPairingCode(phone);
          const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
          console.log(`Pairing code: ${formatted}`);
          io.emit('pairing_code', { code: formatted });
        } catch (err) {
          io.emit('error', { message: 'Failed to get pairing code' });
        }
      }

      if (connection === 'open') {
        io.emit('status', { message: '✅ Connected! Saving session...' });
        await new Promise(r => setTimeout(r, 2000));
        const session = exportSession();
        if (session) io.emit('session_ready', { session });
        setTimeout(() => sock.ws?.close(), 1500);
      }

      if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        io.emit('error', { message: 'Connection closed. Try again.' });
      }
    });

  } catch (err) {
    io.emit('error', { message: err.message });
  }
});

// QR Code Route
app.get('/qr-start', async (req, res) => {
  res.json({ success: true });

  try {
    if (fs.existsSync(TEMP)) fs.rmSync(TEMP, { recursive: true, force: true });
    fs.mkdirSync(TEMP, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(TEMP);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
      },
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
      logger: pino({ level: 'silent' }),
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
        io.emit('status', { message: '✅ Scanned successfully!' });
        await new Promise(r => setTimeout(r, 2000));
        const session = exportSession();
        if (session) io.emit('session_ready', { session });
        setTimeout(() => sock.ws?.close(), 1500);
      }
    });

  } catch (err) {
    io.emit('error', { message: err.message });
  }
});

function exportSession() {
  try {
    const credsPath = path.join(TEMP, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;
    const creds = fs.readFileSync(credsPath, 'utf-8');
    return `Gifted~${Buffer.from(creds).toString('base64')}`;
  } catch (e) {
    console.error('Export error:', e);
    return null;
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Companion pairing site running on port ${PORT}`);
});

function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JobX Bot - Get Session</title>
<script src="/socket.io/socket.io.js"></script>
<style>
  body{font-family:Segoe UI,sans-serif;background:#0a0e2e;color:#e0e8ff;margin:0;padding:20px}
  .header{background:linear-gradient(135deg,#1a237e,#1565c0);padding:20px;text-align:center;border-radius:12px}
  .tabs{display:flex;margin:20px 0;background:#0d1b4b;border-radius:12px;overflow:hidden}
  .tab{padding:14px 30px;cursor:pointer;flex:1;text-align:center}
  .tab.active{background:#1565c0;color:white}
  .box{background:#0d1b4b;border:1px solid #1e3a8a;border-radius:12px;padding:25px;margin:15px 0}
  input, button{width:100%;padding:14px;margin:8px 0;border-radius:8px;border:none;font-size:1rem}
  input{background:#091640;color:white}
  button{background:linear-gradient(135deg,#1565c0,#0d47a1);color:white;font-weight:600;cursor:pointer}
  .code{font-size:2.4rem;letter-spacing:8px;font-weight:bold;color:#42a5f5;text-align:center;margin:15px 0}
  .session-box{background:#050d30;padding:15px;border-radius:8px;word-break:break-all;font-size:0.85rem;max-height:150px;overflow:auto}
  #qrImg{width:260px;height:260px;margin:15px auto;display:block;border-radius:12px}
  .success{color:#4caf50;font-size:1.1rem;text-align:center}
  .err{color:#f44336;text-align:center}
</style>
</head>
<body>
<div class="header">
  <h1>🇵🇰 JobX Bot Session Generator</h1>
</div>

<div class="tabs">
  <div class="tab active" onclick="showTab(0)">Pairing Code</div>
  <div class="tab" onclick="showTab(1)">QR Code</div>
</div>

<div class="box" id="pairTab">
  <input type="text" id="phone" placeholder="923001234567" />
  <button onclick="getPairCode()">Get Pairing Code</button>
  <div id="pairResult" class="hidden">
    <p style="text-align:center;margin:10px">Enter this code in WhatsApp:</p>
    <div class="code" id="pairCode">---- ----</div>
  </div>
</div>

<div class="box hidden" id="qrTab">
  <button onclick="startQR()">Generate QR Code</button>
  <div id="qrBox" class="hidden"><img id="qrImg" src=""></div>
</div>

<div class="box hidden" id="sessionTab">
  <p class="success">✅ Session Ready!</p>
  <div class="session-box" id="sessionStr"></div>
  <button onclick="copySession()">Copy SESSION_ID</button>
</div>

<div class="box hidden" id="errTab">
  <p class="err" id="errMsg"></p>
  <button onclick="location.reload()">Try Again</button>
</div>

<script>
const socket = io();

function showTab(n) {
  document.getElementById('pairTab').classList.toggle('hidden', n !== 0);
  document.getElementById('qrTab').classList.toggle('hidden', n !== 1);
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', i===n));
}

async function getPairCode() {
  const phone = document.getElementById('phone').value.trim();
  if (!phone) return alert('Enter phone number');
  await fetch('/pair', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone})});
}

async function startQR() {
  document.getElementById('qrBox').classList.remove('hidden');
  await fetch('/qr-start');
}

socket.on('pairing_code', data => {
  document.getElementById('pairCode').textContent = data.code;
  document.getElementById('pairResult').classList.remove('hidden');
});

socket.on('qr', data => {
  document.getElementById('qrImg').src = data.image;
});

socket.on('session_ready', data => {
  document.getElementById('sessionStr').textContent = data.session;
  document.getElementById('sessionTab').classList.remove('hidden');
});

socket.on('error', data => {
  document.getElementById('errMsg').textContent = data.message;
  document.getElementById('errTab').classList.remove('hidden');
});

function copySession() {
  navigator.clipboard.writeText(document.getElementById('sessionStr').textContent);
  alert('✅ Copied! Paste as SESSION_ID in your main bot config');
}
</script>
</body>
</html>`;
