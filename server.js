const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from Vite build output (our custom config uses dist/public)
const distPath = path.join(__dirname, "dist/public");
app.use(express.static(distPath));

// (Optional) health check
app.get("/health", (_req, res) => res.status(200).send("ok"));

// SPA fallback for React Router
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});