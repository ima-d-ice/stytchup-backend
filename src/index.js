const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const designRoutes = require('./routes/designRoutes');
const profileRoutes = require('./routes/profileRoutes');
const designerRoutes = require('./routes/designerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const inboxRoutes = require('./routes/inboxRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { initSocket } = require('./lib/socket');
const { createServer } = require('http');

dotenv.config();
const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

const port = process.env.PORT || 4000;

// --- MIDDLEWARE ---
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'https://stytchup.vercel.app'],
  credentials: true
}));
// Single JSON parser with raised limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));

// --- ROUTING ---
app.use('/auth', authRoutes);
app.use('/designs', designRoutes);
app.use('/profile', profileRoutes);
app.use('/designers', designerRoutes);
app.use('/payments', paymentRoutes);
app.use('/inbox', inboxRoutes);
app.use('/orders', orderRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

// --- START SERVER ---
if (require.main === module) {
  httpServer.listen(port, () => console.log(`API & Sockets running on http://localhost:${port}`));
}

module.exports = { app, httpServer };
