// server/server.cjs
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// absolute path to Vite output: dist/public
const distPublic = path.resolve(__dirname, "../dist/public");

// serve static assets (no index to avoid double send)
app.use(express.static(distPublic, {
  index: false,
  maxAge: "1y",
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

// (optional) simple health check
app.get("/health", (_, res) => res.status(200).send("ok"));

// your API routes go here (before SPA fallback)
// e.g. app.get("/api/hello", (_,res)=>res.json({ok:true}));

// SPA fallback — always send index.html so /route loads the app
app.get("*", (_, res) => {
  res.sendFile(path.join(distPublic, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SoarTV listening on ${PORT}`);
});