const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

const clientBuildPath = path.join(__dirname, '../dist/public');
app.use(express.static(clientBuildPath));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`SoarTV server listening on ${port}`));