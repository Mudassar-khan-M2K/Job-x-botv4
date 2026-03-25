require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));

const TEMP = path.join(__dirname, 'temp_session');
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

app.get('/', (req, res) => {
  res.send(`
    <h1>JobX Pairing</h1>
    <form action="/pair" method="POST">
      <input name="phone" placeholder="923477262704" style="padding:12px;width:280px" />
      <button type="submit" style="padding:12px">Get Pairing Code</button>
    </form>
    <p>After submit, check Heroku logs for code + SESSION_ID</p>
  `);
});

app.post('/pair', async (req, res) => {
  let phone = (req.body.phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) phone = '92' + phone.slice(1);
  if (!phone.startsWith('92')) phone = '92' + phone;

  res.send(`Connecting to WhatsApp for ${phone}... Check logs now`);

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

    sock.ev.on('connection.update', (update) => {
      if (update.qr) console.log("QR ready (ignore)");

      if (update.connection === 'open') {
        console.log("✅ Connected successfully!");

        const session = `Gifted~${Buffer.from(JSON.stringify(state.creds)).toString('base64')}`;
        console.log("\n🔥 COPY THIS SESSION_ID:\n" + session + "\n");

        setTimeout(() => process.exit(0), 2000);
      }
    });

    // Request pairing code
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phone);
        console.log(`\n🔥 PAIRING CODE: ${code.match(/.{1,4}/g).join('-')}\n`);
      } catch (e) {
        console.log("Pairing code error:", e.message);
      }
    }, 3000);

  } catch (e) {
    console.error(e);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Pairing site live on port ${PORT}`));
