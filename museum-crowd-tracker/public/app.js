const board = document.getElementById("board");
const modePill = document.getElementById("modePill");
const updatedAt = document.getElementById("updatedAt");

const LEVEL_COLOR = {
  Quiet: "#5c8b6e",
  Moderate: "#c99a3c",
  Busy: "#c2703f",
  "Very Busy": "#a8422f",
  Unknown: "#8a7f68",
};

function gaugeHtml(score) {
  const filled = score == null ? 0 : Math.round((score / 100) * 10);
  let dots = "";
  for (let i = 0; i < 10; i++) {
    dots += `<i class="${i < filled ? "on" : ""}"></i>`;
  }
  return dots;
}

function cardHtml(entry) {
  const { name, city, crowd } = entry;
  const labelClass = crowd.label.replace(" ", "-");
  const color = LEVEL_COLOR[crowd.label] || LEVEL_COLOR.Unknown;
  return `
    <article class="card" style="--dot-color:${color}">
      <div class="gauge">${gaugeHtml(crowd.score)}</div>
      <h2>${name}</h2>
      <p class="city">${city}</p>
      <div class="status-row">
        <span class="status-label ${labelClass}">${crowd.label}</span>
        <span class="status-score">${crowd.score != null ? crowd.score + "% full" : "no data"}</span>
      </div>
    </article>
  `;
}

async function load() {
  board.innerHTML = `<p style="color:#8a7f68">Reading gallery floors…</p>`;
  try {
    const res = await fetch("/api/crowd-levels");
    const data = await res.json();

    modePill.textContent = data.dataMode === "live" ? "Live data (SerpApi)" : "Demo data (mock)";
    updatedAt.textContent = "Updated " + new Date(data.updatedAt).toLocaleTimeString();

    board.innerHTML = data.results
      .sort((a, b) => (a.crowd.score ?? 0) - (b.crowd.score ?? 0))
      .map(cardHtml)
      .join("");
  } catch (err) {
    board.innerHTML = `<p style="color:#a8422f">Couldn't load crowd data. Is the server running?</p>`;
    console.error(err);
  }
}

load();
setInterval(load, 5 * 60 * 1000); // refresh every 5 minutes
