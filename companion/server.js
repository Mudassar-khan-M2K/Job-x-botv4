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

// ─── Pairing Code ─────────────────────────────────────────────────────────────
app.post('/pair', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.json({ error: 'Phone number required' });

  phone = phone.replace(/[^0-9]/g, '');
  if (!phone.startsWith('92') && phone.startsWith('0')) {
    phone = '92' + phone.slice(1);
  }

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

      // ✅ Official Baileys pattern: request code on QR event + not registered
      if (qr && !codeSent && !sock.authState.creds.registered) {
        codeSent = true;
        try {
          const code = await sock.requestPairingCode(phone);
          const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
          console.log(`Pairing code for ${phone}: ${formatted}`);
          io.emit('pairing_code', { code: formatted });
        } catch (err) {
          console.error('Pairing code error:', err.message);
          io.emit('error', { message: 'Could not get code: ' + err.message });
        }
      }

      if (connection === 'open') {
        console.log('Connected!');
        io.emit('status', { message: '✅ Linked! Saving session...' });
        await new Promise(r => setTimeout(r, 3000));
        await saveCreds();
        const session = exportSession();
        if (session) {
          io.emit('session_ready', { session });
        } else {
          io.emit('error', { message: 'Session export failed. Try again.' });
        }
        setTimeout(() => { try { sock.ws.close(); } catch (_) {} }, 2000);
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log('Connection closed, code:', code);
        if (code !== DisconnectReason.loggedOut && !codeSent) {
          io.emit('error', { message: 'Connection closed. Please try again.' });
        }
      }
    });

  } catch (err) {
    console.error(err);
    io.emit('error', { message: err.message });
  }
});

// ─── QR Code ──────────────────────────────────────────────────────────────────
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
        io.emit('status', { message: '✅ Scanned! Saving session...' });
        await new Promise(r => setTimeout(r, 3000));
        await saveCreds();
        const session = exportSession();
        if (session) io.emit('session_ready', { session });
        setTimeout(() => { try { sock.ws.close(); } catch (_) {} }, 2000);
      }
    });

  } catch (err) {
    io.emit('error', { message: err.message });
  }
});

// ─── Export Session ───────────────────────────────────────────────────────────
function exportSession() {
  try {
    const credsPath = path.join(TEMP, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;
    const creds = fs.readFileSync(credsPath, 'utf-8');
    return `Gifted~${Buffer.from(creds).toString('base64')}`;
  } catch (err) {
    console.error('Export error:', err);
    return null;
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Companion running on port ${PORT}`));

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
.tabs{display:flex;margin:30px 0 0;background:#0d1b4b;border-radius:12px;overflow:hidden;border:1px solid #1e3a8a}
.tab{padding:12px 30px;cursor:pointer;font-size:.9rem;color:#90caf9;transition:.2s}
.tab.active{background:#1565c0;color:#fff}
.box{background:#0d1b4b;border:1px solid #1e3a8a;border-radius:12px;padding:30px;width:100%;max-width:500px;margin:20px}
input{width:100%;padding:12px;background:#091640;border:1px solid #1e3a8a;border-radius:8px;color:#e0e8ff;font-size:1rem;margin-bottom:12px}
button{width:100%;padding:12px;background:linear-gradient(135deg,#1565c0,#0d47a1);border:none;border-radius:8px;color:#fff;font-size:1rem;cursor:pointer;font-weight:600}
button:disabled{opacity:.5;cursor:not-allowed}
.result{background:#091640;border:1px solid #1e3a8a;border-radius:8px;padding:16px;margin-top:16px}
.code{font-size:2.2rem;font-weight:700;color:#42a5f5;letter-spacing:6px;text-align:center;margin:10px 0;font-family:monospace}
.session-box{background:#050d30;border:1px solid #0d47a1;border-radius:8px;padding:12px;font-size:.75rem;color:#90caf9;word-break:break-all;max-height:120px;overflow-y:auto;margin-top:8px}
#qrImg{width:220px;height:220px;display:block;margin:10px auto;border-radius:8px}
.step{color:#90caf9;font-size:.85rem;margin-bottom:8px;padding-left:10px;border-left:2px solid #1565c0}
.success{color:#4caf50;font-weight:700;text-align:center;margin-top:10px;font-size:1rem}
.err{color:#f44336;font-weight:600;text-align:center;margin-top:10px}
.hidden{display:none}
.copy-btn{background:#0d47a1;padding:8px;font-size:.8rem;margin-top:8px}
.status{color:#ffb74d;text-align:center;font-size:.85rem;margin-top:8px}
.spinner{display:inline-block;width:14px;height:14px;border:2px solid #42a5f5;border-top-color:transparent;border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle;margin-right:6px}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="header">
  <h1>🇵🇰 Pakistan Jobs Bot</h1>
  <p>Generate SESSION_ID for your bot</p>
</div>

<div class="tabs">
  <div class="tab active" onclick="showTab('pair')">📱 Pairing Code</div>
  <div class="tab" onclick="showTab('qr')">📷 QR Code</div>
</div>

<div class="box" id="tab-pair">
  <p class="step">1. Enter number with country code — no + sign</p>
  <p class="step">2. Click Get Code and wait a few seconds</p>
  <p class="step">3. WhatsApp → ⋮ → Linked Devices → Link a Device → Link with phone number</p>
  <p class="step">4. Enter the 8-digit code shown</p>
  <br>
  <input type="text" id="phoneInput" placeholder="923477262704" />
  <button id="pairBtn" onclick="getPairCode()">📲 Get Pairing Code</button>
  <div id="pairStatus" class="status hidden"></div>
  <div id="pairResult" class="result hidden">
    <p style="color:#90caf9;text-align:center;font-size:.85rem">Enter this in WhatsApp now:</p>
    <div class="code" id="pairCode">----</div>
    <p style="color:#ffb74d;text-align:center;font-size:.78rem">⏰ Expires in ~60s</p>
  </div>
</div>

<div class="box hidden" id="tab-qr">
  <p class="step">1. Click Generate QR</p>
  <p class="step">2. WhatsApp → Linked Devices → Link a Device → Scan QR</p>
  <br>
  <button onclick="startQR()">📷 Generate QR Code</button>
  <div id="qrBox" class="result hidden">
    <img id="qrImg" src="" alt="QR" />
    <p class="status">Scan with WhatsApp</p>
  </div>
</div>

<div class="box hidden" id="sessionBox">
  <p class="success">✅ Session ready! Copy below:</p>
  <div class="session-box" id="sessionStr"></div>
  <button class="copy-btn" onclick="copySession()">📋 Copy SESSION_ID</button>
  <p style="color:#4caf50;font-size:.78rem;margin-top:10px;text-align:center">
    Heroku Main Bot → Settings → Config Vars → SESSION_ID
  </p>
</div>

<div class="box hidden" id="errBox">
  <p class="err" id="errMsg"></p>
  <button onclick="location.reload()">🔄 Try Again</button>
</div>

<script>
const socket = io();
function showTab(n){
  ['pair','qr'].forEach(t=>document.getElementById('tab-'+t).classList.toggle('hidden',t!==n));
  document.querySelectorAll('.tab').forEach((e,i)=>e.classList.toggle('active',['pair','qr'][i]===n));
}
async function getPairCode(){
  const phone=document.getElementById('phoneInput').value.replace(/[^0-9]/g,'');
  if(!phone||phone.length<10)return alert('Enter valid number\nExample: 923477262704');
  const btn=document.getElementById('pairBtn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span>Connecting...';
  const s=document.getElementById('pairStatus');
  s.classList.remove('hidden'); s.innerHTML='<span class="spinner"></span>Connecting to WhatsApp...';
  try{
    await fetch('/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
    s.innerHTML='<span class="spinner"></span>Waiting for pairing code...';
  }catch(e){ showErr(e.message); resetBtn(); }
}
async function startQR(){
  document.getElementById('qrBox').classList.remove('hidden');
  await fetch('/qr-start');
}
function resetBtn(){
  const btn=document.getElementById('pairBtn');
  btn.disabled=false; btn.innerHTML='📲 Get Pairing Code';
}
socket.on('pairing_code',({code})=>{
  document.getElementById('pairCode').textContent=code;
  document.getElementById('pairResult').classList.remove('hidden');
  document.getElementById('pairStatus').innerHTML='✅ Enter this code in WhatsApp now!';
  resetBtn();
});
socket.on('qr',({image})=>{
  document.getElementById('qrImg').src=image;
  document.getElementById('qrBox').classList.remove('hidden');
});
socket.on('status',({message})=>{
  const s=document.getElementById('pairStatus');
  s.innerHTML=message; s.classList.remove('hidden');
});
socket.on('session_ready',({session})=>{
  document.getElementById('sessionStr').textContent=session;
  document.getElementById('sessionBox').classList.remove('hidden');
  document.getElementById('pairResult').classList.add('hidden');
  document.getElementById('qrBox').classList.add('hidden');
});
socket.on('error',({message})=>{ showErr(message); resetBtn(); });
function showErr(msg){
  document.getElementById('errMsg').textContent='❌ '+msg;
  document.getElementById('errBox').classList.remove('hidden');
}
function copySession(){
  navigator.clipboard.writeText(document.getElementById('sessionStr').textContent)
    .then(()=>alert('✅ Copied! Paste in Heroku Config Vars → SESSION_ID'));
}
</script>
</body>
</html>`;
}
