# Gallery Hours — US Museum Crowd Tracker

A small dashboard that shows how crowded major US museums are right now, so you can
pick a quieter time to visit. Built to deploy on [shadw.cloud](https://shadw.cloud).

## What's included
- Node.js/Express backend (`server.js`) serving a JSON API
- A static dashboard (`public/`) with a museum-plaque inspired design
- A starter list of 15 major US museums (`data/museums.js`) — edit freely
- A pluggable crowd-data provider (`services/crowdProvider.js`):
  - **Mock mode** (default): realistic-looking demo data, no setup required
  - **Live mode**: pulls real Google Maps "popular times" data via [SerpApi](https://serpapi.com), once you add a `SERPAPI_KEY`

## Run locally
```bash
npm install
npm start
# open http://localhost:3000
```

## Deploy to shadw.cloud
1. Push this folder to a GitHub repo (or keep the Dockerfile — both work).
2. In shadw.cloud, go to **Projects → Add New → Import Git Repository** and select the repo.
   (Or choose **Deploy from Dockerfile** and point it at the included `Dockerfile`.)
3. Once deployed, go to your project's **Settings/Environment Variables** and optionally add:
   ```
   SERPAPI_KEY=your_key_here
   ```
   Without this, the dashboard runs fine on mock data — useful for demoing before you commit to a paid data source.
4. Attach a custom domain under the **Domains** tab if you want one.

## Why mock data by default?
Google doesn't expose a free, official API for live museum "how busy is it" data.
The realistic path to real numbers is a third-party service like SerpApi, which
scrapes/proxies Google Maps' popular-times data (it has a free trial, then paid tiers).
The provider file is written so swapping in a different data source later — a museum's
own timed-ticketing API, for instance — only means adding one new `case` in
`services/crowdProvider.js`, without touching the server or frontend.

## Extending this
- Add more museums in `data/museums.js`
- Swap the color palette / typography in `public/style.css`
- Add a history view by writing each `getCrowdLevel()` result to shadw's Storage,
  so you can chart "best time of day" trends over a few weeks
