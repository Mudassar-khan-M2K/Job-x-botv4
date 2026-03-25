require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TEMP = path.join(__dirname, 'temp_session');
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });

app.get('/', (req, res) => {
  res.send(`
    <h1>🇵🇰 JobX Pairing Site</h1>
    <form action="/pair" method="POST">
      <input name="phone" placeholder="923477262704" style="padding:12px;width:300px" />
      <button type="submit" style="padding:12px">Get Pairing Code</button>
    </form>
    <p>After getting code, check Heroku logs for SESSION_ID</p>
  `);
});

app.post('/pair', async (req, res) => {
  let phone = req.body.phone ? req.body.phone.replace(/[^0-9]/g, '') : '';
  
  if (!phone) {
    return res.send('❌ Enter phone number');
  }
  if (phone.startsWith('0')) phone = '92' + phone.slice(1);
  if (!phone.startsWith('92')) phone = '92' + phone;

  res.send(`✅ Trying to get code for ${phone}... Check logs`);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(TEMP);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
      },
      browser: Browsers.ubuntu('Chrome'),
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      if (update.qr) console.log('QR generated (not used here)');
      
      if (update.connection === 'open') {
        console.log('✅ WhatsApp Connected!');
        const session = `Gifted~${Buffer.from(JSON.stringify(state.creds)).toString('base64')}`;
        console.log('\n🔥 YOUR SESSION_ID:\n' + session + '\n');
        io.emit('session', session);
        setTimeout(() => process.exit(0), 3000); // restart after success
      }
    });

  } catch (err) {
    console.error(err);
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Pairing site live on port ${PORT}`));
