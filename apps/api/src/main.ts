import express, { type Request, type Response } from 'express';
import http from "http";
import {prisma} from "@nosana-agent/db";
import cors from 'cors';
import indexRouter from './routes';
import {WebSocketServer} from "ws";
import dotenv from "dotenv";
import { setupWebsocket } from './ws/webSocket';


dotenv.config({path: "*"})

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server,path: "/ws"})


setupWebsocket(wss);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (_req: Request, res: Response) => {
  res.send('API is running 🚀');
});

app.get('/health', async (_req:Request, res:Response) => {
  const sessions = await prisma.session.findMany();
  res.status(200).json({ status: 'ok' ,_sessions: sessions});
});

app.use("/api/v1",indexRouter);

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
