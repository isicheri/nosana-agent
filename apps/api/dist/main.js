import express, {} from 'express';
import { prisma } from "@nosana-agent/db";
import cors from 'cors';
import indexRouter from './routes';
import {} from "ws";
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.get('/', (_req, res) => {
    res.send('API is running 🚀');
});
app.get('/health', async (_req, res) => {
    const sessions = await prisma.session.findMany();
    res.status(200).json({ status: 'ok', _sessions: sessions });
});
app.use("/api/v1", indexRouter);
// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=main.js.map