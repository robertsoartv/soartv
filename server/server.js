// server/server.js
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Serve the built frontend (Vite = dist/public, CRA = client/build)
const clientBuildPath = path.join(__dirname, '../dist/public');
app.use(express.static(clientBuildPath));

// Example API route
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// SPA fallback to index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`SoarTV server listening on ${port}`));