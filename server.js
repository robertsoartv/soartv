import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve Vite build files
const distPath = path.join(__dirname, "dist", "public");
app.use(express.static(distPath));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

// Fallback for SPA routes
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ SoarTV server running on port ${PORT}`);
});
