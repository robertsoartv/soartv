// server/server.cjs
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: point to ../dist/public *from* server/server.cjs
const CLIENT_BUILD = path.join(__dirname, '../dist/public');

// Serve static assets
app.use(express.static(CLIENT_BUILD, { index: false }));

// Your API routes go here (if any), e.g.:
app.get('/api/health', (req, res) => res.json({ ok: true }));

// SPA fallback: always send index.html (AFTER API routes)
app.get('*', (_req, res) => {
  res.sendFile(path.join(CLIENT_BUILD, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SoarTV server listening on ${PORT}`);
});