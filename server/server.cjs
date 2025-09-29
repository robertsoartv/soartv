// server/server.cjs
const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Where Vite put the build (matches your build logs)
const publicDir = path.resolve(__dirname, "../dist/public");

// Serve static assets (don't auto-serve index.html here)
app.use(
  express.static(publicDir, {
    index: false,
    maxAge: "1y",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

// ---- Your API routes (if any) should be mounted BEFORE the SPA fallback ----
// Example:
// const api = require('./api'); 
// app.use('/api', api);

// SPA fallback: anything not handled above returns index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SoarTV production server listening on ${PORT}`);
});