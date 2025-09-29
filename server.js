const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.join(__dirname, "dist", "public");
app.use(express.static(distPath));

app.get("/health", (_req, res) => res.status(200).send("ok"));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));