require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
const TEMP = path.join(__dirname, 'temp_session');
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

app.get('/', (req, res) => {
  res.send(`
    <h1>🇵🇰 JobX Bot - Scan QR</h1>
    <p>Scan with WhatsApp → Linked Devices</p>
    <div id="qr"></div>
    <p id="status">Loading QR Code...</p>

    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <script>
      const socket = io();
      socket.on('qr', (data) => {
        document.getElementById('qr').innerHTML = '<img src="' + data.image + '" width="280">';
        document.getElementById('status').innerHTML = '✅ Scan now';
      });
      socket.on('ready', () => {
        document.getElementById('status').innerHTML = '<b style="color:green">✅ Success! Check logs for SESSION_ID</b>';
      });
    </script>
  `);
});

app.get('/start', async (req, res) => {
  res.send('Starting QR... check logs');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(TEMP);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      if (update.qr) {
        const image = await QRCode.toDataURL(update.qr);
        console.log("✅ QR Generated");
      }

      if (update.connection === 'open') {
        console.log("✅ Connected!");

        const session = `Gifted~${Buffer.from(JSON.stringify(state.creds)).toString('base64')}`;
        console.log("\n🔥 YOUR SESSION_ID (copy this):\n" + session + "\n");

        setTimeout(() => process.exit(0), 2000);
      }
    });

  } catch (e) {
    console.error(e);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ QR Pairing site live on port ${PORT}`));
