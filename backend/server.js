const express = require("express");
const cors = require("cors");
const { places, categories, connections } = require("./data/places");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Get all places
app.get("/api/places", (req, res) => {
  const { q, category } = req.query;
  let result = [...places];

  if (q) {
    const term = q.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }

  if (category && category !== "all") {
    result = result.filter(
      (p) =>
        p.category.toLowerCase().includes(category.toLowerCase()) ||
        p.type === category.toLowerCase()
    );
  }

  res.json(result);
});

// Get single place
app.get("/api/places/:id", (req, res) => {
  const place = places.find((p) => p.id === req.params.id);
  if (!place) return res.status(404).json({ error: "Place not found" });
  res.json(place);
});

// Get categories
app.get("/api/categories", (req, res) => {
  res.json(categories);
});

// Simple Dijkstra-style shortest path for accessible routing
function findRoute(fromId, toId, accessibleOnly = true) {
  const graph = {};
  places.forEach((p) => {
    graph[p.id] = [];
  });

  connections.forEach((c) => {
    if (accessibleOnly && !c.accessible) return;
    graph[c.from].push({ to: c.to, distance: c.distance });
    graph[c.to].push({ to: c.from, distance: c.distance });
  });

  const distances = {};
  const previous = {};
  const pq = [];

  places.forEach((p) => {
    distances[p.id] = Infinity;
    previous[p.id] = null;
  });
  distances[fromId] = 0;
  pq.push({ id: fromId, dist: 0 });

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { id: current } = pq.shift();

    if (current === toId) break;

    (graph[current] || []).forEach(({ to, distance }) => {
      const alt = distances[current] + distance;
      if (alt < distances[to]) {
        distances[to] = alt;
        previous[to] = current;
        pq.push({ id: to, dist: alt });
      }
    });
  }

  if (distances[toId] === Infinity) {
    return null;
  }

  // Reconstruct path
  const path = [];
  let curr = toId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  const pathPlaces = path.map((id) => places.find((p) => p.id === id));
  const totalDistance = distances[toId];
  const walkingSpeed = 80; // m/min approximate
  const totalTime = Math.round(totalDistance / walkingSpeed);

  // Generate simple turn-by-turn steps
  const steps = [];
  for (let i = 0; i < pathPlaces.length - 1; i++) {
    const from = pathPlaces[i];
    const to = pathPlaces[i + 1];
    const conn = connections.find(
      (c) =>
        (c.from === from.id && c.to === to.id) ||
        (c.from === to.id && c.to === from.id)
    );
    const dist = conn ? conn.distance : 100;

    let instruction = "";
    if (i === 0) {
      instruction = `Head towards ${to.name}`;
    } else if (i === pathPlaces.length - 2) {
      instruction = `Arrive at ${to.name}`;
    } else {
      instruction = `Continue to ${to.name}`;
    }

    steps.push({
      instruction,
      distance: dist,
      place: to.name,
      lat: to.lat,
      lng: to.lng
    });
  }

  return {
    path: pathPlaces,
    totalDistance,
    totalTime,
    steps,
    accessible: true
  };
}

// Calculate route
app.get("/api/route", (req, res) => {
  const { from, to, accessible } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: "from and to are required" });
  }

  const fromPlace = places.find((p) => p.id === from || p.name.toLowerCase() === from.toLowerCase());
  const toPlace = places.find((p) => p.id === to || p.name.toLowerCase() === to.toLowerCase());

  if (!fromPlace || !toPlace) {
    return res.status(404).json({ error: "Place not found" });
  }

  const route = findRoute(fromPlace.id, toPlace.id, accessible !== "false");
  if (!route) {
    return res.status(404).json({ error: "No route found" });
  }

  res.json({
    from: fromPlace,
    to: toPlace,
    ...route
  });
});

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", campus: "University of Limpopo" });
});

app.listen(PORT, () => {
  console.log(`UL Campus Nav API running on http://localhost:${PORT}`);
});
