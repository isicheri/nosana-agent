import express, {} from "express";
import cors from "cors";
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.get("/", (_req, res) => {
    res.send("API is running 🚀");
});
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=main.js.map