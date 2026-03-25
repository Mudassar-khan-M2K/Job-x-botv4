require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

const TEMP = path.join(__dirname, 'temp_session');
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

app.get('/', (req, res) => res.send(`
  <h1>🇵🇰 JobX Pairing</h1>
  <button onclick="location.href='/qr-start'">Generate QR</button>
  <hr>
  <form action="/pair" method="POST">
    <input name="phone" placeholder="923001234567" />
    <button type="submit">Get Pairing Code</button>
  </form>
`));

app.post('/pair', async (req, res) => {
  let phone = req.body.phone?.replace(/[^0-9]/g,'');
  if (phone.startsWith('0')) phone = '92' + phone.slice(1);

  res.send('Connecting... Check console/logs');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(TEMP);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
      browser: Browsers.ubuntu('Chrome'),
      logger: pino({level:'silent'})
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      if (update.qr) {
        const url = await QRCode.toDataURL(update.qr);
        console.log('QR generated');
      }
      if (update.connection === 'open') {
        console.log('✅ Connected!');
        const session = `Gifted~${Buffer.from(JSON.stringify(state.creds)).toString('base64')}`;
        console.log('SESSION_ID:', session);
        io.emit('session', session);
      }
    });
  } catch(e) {
    console.error(e);
  }
});

app.get('/qr-start', async (req, res) => {
  res.send('Generating QR... check logs');
  // same logic as above but for QR
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Pairing site live on port ${PORT}`));
