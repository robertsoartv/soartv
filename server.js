const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from Vite build (dist/public instead of build)
app.use(express.static(path.join(__dirname, "dist/public")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

// Fallback: send index.html for all other routes (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});