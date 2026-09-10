export const places = [
  {
    id: "main-parking",
    name: "Main Parking",
    category: "Transport & Parking",
    type: "parking",
    icon: "parking",
    color: "#3B82F6",
    lat: -23.8895,
    lng: 29.7375,
    description: "Main campus parking area",
    accessible: true
  },
  {
    id: "university-library",
    name: "University Library",
    category: "Academic",
    type: "academic",
    icon: "book",
    color: "#3B82F6",
    lat: -23.8868,
    lng: 29.7388,
    description: "Central University Library with study spaces",
    accessible: true,
    entrances: ["Main Entrance (Automatic Doors)"]
  },
  {
    id: "science-building",
    name: "Science Building",
    category: "Academic",
    type: "academic",
    icon: "book",
    color: "#3B82F6",
    lat: -23.8855,
    lng: 29.7402,
    description: "Faculty of Science building",
    accessible: true
  },
  {
    id: "humanities-building",
    name: "Humanities Building",
    category: "Academic",
    type: "academic",
    icon: "book",
    color: "#3B82F6",
    lat: -23.8862,
    lng: 29.7415,
    description: "Faculty of Humanities",
    accessible: true
  },
  {
    id: "engineering-building",
    name: "Engineering Building",
    category: "Academic",
    type: "academic",
    icon: "book",
    color: "#3B82F6",
    lat: -23.8865,
    lng: 29.7365,
    description: "Faculty of Engineering",
    accessible: true
  },
  {
    id: "health-wellness",
    name: "Health & Wellness Centre",
    category: "Students Support",
    type: "support",
    icon: "users",
    color: "#22C55E",
    lat: -23.8878,
    lng: 29.7405,
    description: "Health services and wellness support for students",
    accessible: true
  },
  {
    id: "student-support",
    name: "Student Support Centre",
    category: "Students Support",
    type: "support",
    icon: "users",
    color: "#22C55E",
    lat: -23.8872,
    lng: 29.7358,
    description: "Student counselling and support services",
    accessible: true
  },
  {
    id: "student-health-clinic",
    name: "Student Health Clinic",
    category: "Students Support",
    type: "support",
    icon: "users",
    color: "#22C55E",
    lat: -23.8882,
    lng: 29.7398,
    description: "On-campus health clinic",
    accessible: true
  },
  {
    id: "student-centre",
    name: "Student Centre (Cafeteria & Shops)",
    category: "Commercial",
    type: "commercial",
    icon: "shopping",
    color: "#F97316",
    lat: -23.8880,
    lng: 29.7368,
    description: "Cafeteria, shops and student services",
    accessible: true
  },
  {
    id: "north-residence",
    name: "North Residence",
    category: "Residence",
    type: "residence",
    icon: "home",
    color: "#A855F7",
    lat: -23.8845,
    lng: 29.7370,
    description: "North student residence",
    accessible: true
  },
  {
    id: "south-residence",
    name: "South Residence",
    category: "Residence",
    type: "residence",
    icon: "home",
    color: "#A855F7",
    lat: -23.8900,
    lng: 29.7360,
    description: "South student residence",
    accessible: true
  },
  {
    id: "sports-complex",
    name: "Sports Complex",
    category: "Recreational Facilities",
    type: "recreation",
    icon: "activity",
    color: "#F97316",
    lat: -23.8890,
    lng: 29.7410,
    description: "Sports fields, track and gym facilities",
    accessible: true
  }
];

export const categories = [
  { id: "academic", name: "Academic", icon: "book", color: "#3B82F6" },
  { id: "residence", name: "Residence", icon: "home", color: "#A855F7" },
  { id: "support", name: "Support", icon: "users", color: "#22C55E" },
  { id: "recreation", name: "Recreation", icon: "activity", color: "#F97316" },
  { id: "commercial", name: "Commercial", icon: "shopping", color: "#EF4444" },
  { id: "more", name: "More", icon: "more", color: "#64748b" }
];

export const connections = [
  { from: "main-parking", to: "university-library", distance: 350, accessible: true },
  { from: "main-parking", to: "student-centre", distance: 280, accessible: true },
  { from: "main-parking", to: "south-residence", distance: 200, accessible: true },
  { from: "university-library", to: "science-building", distance: 180, accessible: true },
  { from: "university-library", to: "humanities-building", distance: 220, accessible: true },
  { from: "university-library", to: "engineering-building", distance: 250, accessible: true },
  { from: "university-library", to: "health-wellness", distance: 200, accessible: true },
  { from: "university-library", to: "student-centre", distance: 180, accessible: true },
  { from: "science-building", to: "humanities-building", distance: 150, accessible: true },
  { from: "engineering-building", to: "student-support", distance: 120, accessible: true },
  { from: "student-centre", to: "student-support", distance: 150, accessible: true },
  { from: "health-wellness", to: "sports-complex", distance: 180, accessible: true },
  { from: "north-residence", to: "engineering-building", distance: 200, accessible: true },
  { from: "north-residence", to: "university-library", distance: 280, accessible: true },
  { from: "south-residence", to: "student-centre", distance: 220, accessible: true },
  { from: "student-health-clinic", to: "health-wellness", distance: 100, accessible: true },
  { from: "student-health-clinic", to: "university-library", distance: 160, accessible: true }
];

export function findRoute(fromId, toId) {
  const graph = {};
  places.forEach((p) => { graph[p.id] = []; });
  connections.forEach((c) => {
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

  if (distances[toId] === Infinity) return null;

  const path = [];
  let curr = toId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  const pathPlaces = path.map((id) => places.find((p) => p.id === id));
  const totalDistance = distances[toId];
  const totalTime = Math.round(totalDistance / 80);

  const steps = [];
  for (let i = 0; i < pathPlaces.length - 1; i++) {
    const from = pathPlaces[i];
    const to = pathPlaces[i + 1];
    const conn = connections.find(
      (c) => (c.from === from.id && c.to === to.id) || (c.from === to.id && c.to === from.id)
    );
    const dist = conn ? conn.distance : 100;
    let instruction = i === 0 ? `Head towards ${to.name}` : i === pathPlaces.length - 2 ? `Arrive at ${to.name}` : `Continue to ${to.name}`;
    steps.push({ instruction, distance: dist, place: to.name, lat: to.lat, lng: to.lng });
  }

  return { path: pathPlaces, totalDistance, totalTime, steps, accessible: true };
}
