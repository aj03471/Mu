const express = require("express");
const path = require("path");
const museums = require("./data/museums");
const { getCrowdLevel, HAS_SERPAPI } = require("./services/crowdProvider");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/museums", (req, res) => {
  res.json({ museums, dataMode: HAS_SERPAPI ? "live" : "mock" });
});

app.get("/api/crowd-levels", async (req, res) => {
  try {
    const results = await Promise.all(
      museums.map(async (m) => {
        const crowd = await getCrowdLevel(m);
        return { id: m.id, name: m.name, city: m.city, crowd };
      })
    );
    res.json({ dataMode: HAS_SERPAPI ? "live" : "mock", updatedAt: new Date().toISOString(), results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch crowd levels" });
  }
});

app.get("/api/crowd-levels/:id", async (req, res) => {
  const museum = museums.find((m) => m.id === req.params.id);
  if (!museum) return res.status(404).json({ error: "Museum not found" });
  const crowd = await getCrowdLevel(museum);
  res.json({ id: museum.id, name: museum.name, city: museum.city, crowd });
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Museum crowd tracker running on port ${PORT}`);
  console.log(`Data mode: ${HAS_SERPAPI ? "LIVE (SerpApi)" : "MOCK (set SERPAPI_KEY for real data)"}`);
});
