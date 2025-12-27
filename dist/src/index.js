"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const designRoutes_1 = __importDefault(require("./routes/designRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
const designerRoutes_1 = __importDefault(require("./routes/designerRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const inboxRoutes_1 = __importDefault(require("./routes/inboxRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const socket_1 = require("./lib/socket");
const http_1 = require("http");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app); // Wrap Express
(0, socket_1.initSocket)(httpServer); // Start Sockets
const port = process.env.PORT || 4000;
// --- MIDDLEWARE ---
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
// --- ROUTING ---
// Mount auth routes at /auth (e.g., /auth/login, /auth/change-role)
app.use('/auth', authRoutes_1.default);
// Increase limit to 10mb or 50mb to allow image uploads via JSON
app.use(express_1.default.json({ limit: '50mb' }));
// Mount design routes at /designs (e.g., /designs, /designs/:id)
// Note: I moved /add/designs to /designs/add to keep it standard
app.use('/designs', designRoutes_1.default);
app.use('/profile', profileRoutes_1.default);
app.use('/designers', designerRoutes_1.default);
app.use('/payments', paymentRoutes_1.default);
app.use('/inbox', inboxRoutes_1.default);
app.use('/orders', orderRoutes_1.default);
// --- START SERVER ---
httpServer.listen(port, () => console.log(`API & Sockets running on http://localhost:${port}`));
