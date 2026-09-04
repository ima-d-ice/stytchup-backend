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
const adminRoutes = require('./routes/adminRoutes');
const { initSocket } = require('./lib/socket');
const { createServer } = require('http');
const swaggerUi = require('swagger-ui-express');
const { spec: openApiSpec } = require('./lib/swagger');

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
app.use('/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Liveness probe (also used by Docker HEALTHCHECK)
 *     security: []
 *     responses:
 *       200:
 *         description: '{ ok: true }'
 */
app.get('/openapi.json', (req, res) => res.json(openApiSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// --- START SERVER ---
if (require.main === module) {
  httpServer.listen(port, () => console.log(`API & Sockets running on http://localhost:${port}`));
}

module.exports = { app, httpServer };
