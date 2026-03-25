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

// Auto-start QR when a browser connects
io.on('connection', (socket) => {
  console.log('Browser connected — starting QR');
  startQRSession();
});

async function startQRSession() {
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
        console.log('QR generated');
      }

      if (connection === 'open') {
        io.emit('status', { message: 'Connected! Generating SESSION_ID...' });
        await new Promise(r => setTimeout(r, 3000));
        await saveCreds();
        const session = exportSession();
        if (session) {
          io.emit('session_ready', { session });
          console.log('Session exported!');
        } else {
          io.emit('error', { message: 'Export failed. Try again.' });
        }
        setTimeout(() => { try { sock.ws.close(); } catch (_) {} }, 2000);
      }

      if (connection === 'close') {
        io.emit('status', { message: 'QR expired. Refreshing...' });
        setTimeout(startQRSession, 2000);
      }
    });

  } catch (err) {
    console.error('Error:', err.message);
    io.emit('error', { message: err.message });
    setTimeout(startQRSession, 5000);
  }
}

function exportSession() {
  try {
    const credsPath = path.join(TEMP, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;
    const creds = fs.readFileSync(credsPath, 'utf-8');
    return 'Gifted~' + Buffer.from(creds).toString('base64');
  } catch (err) {
    console.error('Export error:', err);
    return null;
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Companion running on port ' + PORT));

function getHTML() {
  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>Pakistan Jobs Bot - Get Session</title>',
    '<script src="/socket.io/socket.io.js"><\/script>',
    '<style>',
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{font-family:Segoe UI,sans-serif;background:#0a0e2e;color:#e0e8ff;min-height:100vh;display:flex;flex-direction:column;align-items:center}',
    '.header{background:linear-gradient(135deg,#1a237e,#1565c0);width:100%;padding:20px;text-align:center}',
    '.header h1{font-size:1.6rem;color:#fff}',
    '.header p{color:#90caf9;margin-top:4px;font-size:.9rem}',
    '.box{background:#0d1b4b;border:1px solid #1e3a8a;border-radius:12px;padding:30px;width:100%;max-width:480px;margin:24px;text-align:center}',
    '.step{color:#90caf9;font-size:.85rem;margin-bottom:8px;padding-left:10px;border-left:2px solid #1565c0;text-align:left}',
    '#qrImg{width:240px;height:240px;display:block;margin:16px auto;border-radius:12px;border:3px solid #1565c0}',
    '.status{color:#ffb74d;font-size:.9rem;margin-top:8px}',
    '.success{color:#4caf50;font-weight:700;font-size:1rem;margin-top:10px}',
    '.session-box{background:#050d30;border:1px solid #0d47a1;border-radius:8px;padding:12px;font-size:.72rem;color:#90caf9;word-break:break-all;max-height:120px;overflow-y:auto;margin-top:12px;text-align:left}',
    'button{width:100%;padding:12px;background:linear-gradient(135deg,#1565c0,#0d47a1);border:none;border-radius:8px;color:#fff;font-size:1rem;cursor:pointer;font-weight:600;margin-top:10px}',
    '.spinner{width:48px;height:48px;border:4px solid #1e3a8a;border-top-color:#42a5f5;border-radius:50%;animation:spin 1s linear infinite;margin:20px auto}',
    '@keyframes spin{to{transform:rotate(360deg)}}',
    '.err{color:#f44336;font-weight:600;margin-top:10px}',
    '<\/style>',
    '<\/head>',
    '<body>',
    '<div class="header">',
    '<h1>Pakistan Jobs Bot</h1>',
    '<p>Scan QR code to generate your SESSION_ID</p>',
    '<\/div>',
    '<div class="box">',
    '<p class="step">1. Wait for QR code to appear below<\/p>',
    '<p class="step">2. Open WhatsApp - Linked Devices - Link a Device<\/p>',
    '<p class="step">3. Scan the QR code<\/p>',
    '<p class="step">4. Copy the SESSION_ID that appears<\/p>',
    '<br>',
    '<div id="loading"><div class="spinner"><\/div><p class="status">Connecting to WhatsApp...<\/p><\/div>',
    '<div id="qrBox" style="display:none"><img id="qrImg" src="" alt="QR"><p class="status">Scan with WhatsApp now<\/p><\/div>',
    '<div id="sessionBox" style="display:none">',
    '<p class="success">SESSION_ID Ready!<\/p>',
    '<p style="color:#90caf9;font-size:.82rem;margin-top:6px">Copy and paste in Heroku - Config Vars - SESSION_ID<\/p>',
    '<div class="session-box" id="sessionStr"><\/div>',
    '<button onclick="copySession()">Copy SESSION_ID<\/button>',
    '<p style="color:#4caf50;font-size:.78rem;margin-top:10px">After pasting - Restart your main bot dyno<\/p>',
    '<\/div>',
    '<div id="errBox" style="display:none"><p class="err" id="errMsg"><\/p><button onclick="location.reload()">Try Again<\/button><\/div>',
    '<\/div>',
    '<script>',
    'var socket = io();',
    'socket.on("qr",function(d){',
    '  document.getElementById("loading").style.display="none";',
    '  document.getElementById("qrImg").src=d.image;',
    '  document.getElementById("qrBox").style.display="block";',
    '});',
    'socket.on("status",function(d){',
    '  console.log(d.message);',
    '});',
    'socket.on("session_ready",function(d){',
    '  document.getElementById("loading").style.display="none";',
    '  document.getElementById("qrBox").style.display="none";',
    '  document.getElementById("sessionStr").textContent=d.session;',
    '  document.getElementById("sessionBox").style.display="block";',
    '});',
    'socket.on("error",function(d){',
    '  document.getElementById("loading").style.display="none";',
    '  document.getElementById("errMsg").textContent=d.message;',
    '  document.getElementById("errBox").style.display="block";',
    '});',
    'function copySession(){',
    '  navigator.clipboard.writeText(document.getElementById("sessionStr").textContent)',
    '    .then(function(){alert("Copied! Paste in Heroku Config Vars - SESSION_ID");});',
    '}',
    '<\/script>',
    '<\/body>',
    '<\/html>'
  ];
  return html.join('\n');
}
