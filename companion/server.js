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

app.get('/', (req, res) => {
  res.send('✅ Server running');
});

// PAIR
app.post('/pair', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.json({ error: 'Phone number required' });

  phone = phone.replace(/[^0-9]/g, '');
  if (!phone.startsWith('92') && phone.startsWith('0')) {
    phone = '92' + phone.slice(1);
  }

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
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    let sent = false;

    sock.ev.on('connection.update', async (u) => {
      const { connection, lastDisconnect } = u;

      if (connection === 'connecting' && !sent) {
        sent = true;
        const code = await sock.requestPairingCode(phone);
        io.emit('pairing_code', { code });
      }

      if (connection === 'open') {
        const session = await exportSession();
        if (session) io.emit('session_ready', { session });
      }

      if (connection === 'close') {
        const c = lastDisconnect?.error?.output?.statusCode;
        if (c !== DisconnectReason.loggedOut) {
          io.emit('error', { message: 'Connection closed' });
        }
      }
    });

    res.json({ success: true });

  } catch (e) {
    res.json({ error: e.message });
  }
});

// QR
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
      logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (u) => {
      const { connection, qr } = u;

      if (qr) {
        const img = await QRCode.toDataURL(qr);
        io.emit('qr', { image: img });
      }

      if (connection === 'open') {
        const session = await exportSession();
        if (session) io.emit('session_ready', { session });
      }
    });

    res.json({ success: true });

  } catch (e) {
    res.json({ error: e.message });
  }
});

async function exportSession() {
  try {
    const p = path.join(TEMP, 'creds.json');
    if (!fs.existsSync(p)) return null;
    return Buffer.from(fs.readFileSync(p)).toString('base64');
  } catch {
    return null;
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Running on ' + PORT));
