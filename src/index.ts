import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import designRoutes from './routes/designRoutes';
import profileRoutes from './routes/profileRoutes';
import designerRoutes from './routes/designerRoutes';
import paymentRoutes from './routes/paymentRoutes';
import inboxRoutes from './routes/inboxRoutes';
import orderRoutes from './routes/orderRoutes';
import { initSocket } from './lib/socket';
import { createServer } from 'http';

dotenv.config();
const app = express();
const httpServer = createServer(app); // Wrap Express
initSocket(httpServer); // Start Sockets

const port = process.env.PORT || 4000;

// --- MIDDLEWARE ---
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true 
}));
app.use(express.json());

// --- ROUTING ---
// Mount auth routes at /auth (e.g., /auth/login, /auth/change-role)
app.use('/auth', authRoutes);
// Increase limit to 10mb or 50mb to allow image uploads via JSON
app.use(express.json({ limit: '50mb' }));
// Mount design routes at /designs (e.g., /designs, /designs/:id)
// Note: I moved /add/designs to /designs/add to keep it standard
app.use('/designs', designRoutes); 
app.use('/profile', profileRoutes);
app.use('/designers', designerRoutes);
app.use('/payments', paymentRoutes);
app.use('/inbox', inboxRoutes);
app.use('/orders', orderRoutes);
// --- START SERVER ---
httpServer.listen(port, () => console.log(`API & Sockets running on http://localhost:${port}`));