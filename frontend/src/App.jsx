import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap
} from "react-leaflet";
import L from "leaflet";
import {
  Map as MapIcon,
  Search,
  Route,
  Star,
  User,
  Menu,
  Bell,
  X,
  Navigation,
  Accessibility,
  ArrowUp,
  Home,
  BookOpen,
  Users,
  ShoppingBag,
  Activity,
  Locate,
  Settings,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  LogOut,
  Edit3,
  Save,
  Mail,
  IdCard,
  GraduationCap,
  Phone,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  Car,
  LayoutGrid,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Plus,
  Lock,
  Footprints
} from "lucide-react";
import "./App.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const CAMPUS_CENTER = [-23.8884, 29.7386];
const UL_NAVY = "#1B2642";
const UL_GOLD = "#C7A941";
const ROUTE_BLUE = "#2563eb";

// Approximate campus bounding box (from ArcGIS data)
const CAMPUS_BBOX = {
  minLat: -23.896,
  maxLat: -23.879,
  minLng: 29.732,
  maxLng: 29.750
};

const CATEGORIES = [
  { id: "all", name: "All", color: UL_NAVY, Icon: LayoutGrid },
  { id: "academic", name: "Academic", color: "#3B82F6", Icon: BookOpen },
  { id: "residence", name: "Residence", color: "#A855F7", Icon: Home },
  { id: "support", name: "Support", color: "#22C55E", Icon: Users },
  { id: "recreation", name: "Recreation", color: "#F97316", Icon: Activity },
  { id: "commercial", name: "Commercial", color: "#EF4444", Icon: ShoppingBag },
  { id: "parking", name: "Parking", color: "#64748B", Icon: Car }
];

// Sample campus events (students & guests). Dates relative to Sep 2026.
const CAMPUS_EVENTS = [
  {
    id: "ev1",
    title: "Welcome Week Orientation",
    date: "2026-09-08",
    time: "09:00",
    endTime: "12:00",
    location: "Student Centre (Cafeteria & Shops)",
    placeId: "student-centre",
    category: "student",
    description: "Orientation for new and returning students. Campus tour and info stalls."
  },
  {
    id: "ev2",
    title: "Library Research Skills Workshop",
    date: "2026-09-10",
    time: "14:00",
    endTime: "16:00",
    location: "University Library",
    placeId: "university-library",
    category: "academic",
    description: "Learn how to search databases, cite sources, and use the library catalogue."
  },
  {
    id: "ev3",
    title: "Science Faculty Open Day",
    date: "2026-09-12",
    time: "10:00",
    endTime: "15:00",
    location: "Science Building",
    placeId: "science-building",
    category: "academic",
    description: "Lab demos, career talks, and meet lecturers. Open to students and guests."
  },
  {
    id: "ev4",
    title: "Intramural Soccer Finals",
    date: "2026-09-13",
    time: "15:30",
    endTime: "17:30",
    location: "Sports Complex",
    placeId: "sports-complex",
    category: "recreation",
    description: "Championship match between North and South residences. Free entry for students."
  },
  {
    id: "ev5",
    title: "Health & Wellness Fair",
    date: "2026-09-15",
    time: "09:00",
    endTime: "13:00",
    location: "Health & Wellness Centre",
    placeId: "health-wellness",
    category: "support",
    description: "Free screenings, mental health tips, and wellness activities."
  },
  {
    id: "ev6",
    title: "Career Fair 2026",
    date: "2026-09-18",
    time: "09:00",
    endTime: "16:00",
    location: "Student Centre (Cafeteria & Shops)",
    placeId: "student-centre",
    category: "student",
    description: "Meet employers, CV clinics, and internship opportunities. Guests welcome."
  },
  {
    id: "ev7",
    title: "Engineering Design Showcase",
    date: "2026-09-20",
    time: "11:00",
    endTime: "15:00",
    location: "Engineering Building",
    placeId: "engineering-building",
    category: "academic",
    description: "Student projects on display. Industry partners invited."
  },
  {
    id: "ev8",
    title: "Cultural Evening",
    date: "2026-09-22",
    time: "18:00",
    endTime: "21:00",
    location: "Humanities Building",
    placeId: "humanities-building",
    category: "student",
    description: "Music, dance, and food from across Africa. Open to the campus community."
  },
  {
    id: "ev9",
    title: "Exam Prep Study Session",
    date: "2026-09-25",
    time: "17:00",
    endTime: "20:00",
    location: "University Library",
    placeId: "university-library",
    category: "academic",
    description: "Quiet study space with peer tutors available for selected modules."
  },
  {
    id: "ev10",
    title: "Residence Sports Day",
    date: "2026-09-27",
    time: "08:00",
    endTime: "14:00",
    location: "Sports Complex",
    placeId: "sports-complex",
    category: "recreation",
    description: "Friendly competition between residences. All students welcome."
  }
];

function createYouAreHereIcon(headingDeg = null) {
  // When heading is known, show a navigation arrow pointing that way; otherwise a simple dot.
  if (headingDeg == null || Number.isNaN(headingDeg)) {
    return L.divIcon({
      className: "custom-marker you-are-here",
      html: `<div style="width:18px;height:18px;border-radius:50%;background:${UL_GOLD};border:2.5px solid white;box-shadow:0 0 0 2px ${UL_NAVY},0 2px 8px rgba(0,0,0,0.35);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }
  const rot = Number(headingDeg);
  return L.divIcon({
    className: "custom-marker you-are-here heading",
    html: `<div class="nav-heading-wrap" style="transform:rotate(${rot}deg);">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="16" fill="rgba(27,38,66,0.18)"/>
        <path d="M18 4 L28 28 L18 23 L8 28 Z" fill="${UL_GOLD}" stroke="${UL_NAVY}" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

const CATEGORY_COLORS = {
  academic: "#3B82F6",
  residence: "#A855F7",
  support: "#22C55E",
  recreation: "#F97316",
  commercial: "#EF4444",
  parking: "#64748B",
  admin: "#0EA5E9",
  other: UL_NAVY
};

function placeCategory(place) {
  const cat = (place?.category || "").toLowerCase();
  if (CATEGORY_COLORS[cat]) return cat;
  const t = `${place?.type || ""} ${place?.name || ""}`.toLowerCase();
  if (t.includes("park") && t.includes("parking") || /\bparking\b/.test(t) || t.includes("vehicles park") || t.includes("car park"))
    return "parking";
  if (t.includes("resid")) return "residence";
  if (t.includes("lectur") || t.includes("lab") || t.includes("academic") || t.includes("library") || t.includes("research"))
    return "academic";
  if (t.includes("recreat") || t.includes("sport") || t.includes("gym")) return "recreation";
  if (t.includes("commerc") || t.includes("shop") || t.includes("restaurant")) return "commercial";
  if (t.includes("support") || t.includes("medic") || t.includes("health")) return "support";
  return "other";
}

function createPlaceIcon(place, selected = false) {
  const cat = placeCategory(place);
  const color = CATEGORY_COLORS[cat] || UL_NAVY;
  // Compact markers — not large circles
  const size = selected ? 18 : 14;
  const isParking = cat === "parking";
  const label = isParking ? "P" : "";
  const fontSize = isParking ? 9 : 0;
  const border = selected ? "2.5px solid #C7A941" : "2px solid white";
  return L.divIcon({
    className: "custom-marker place-dot",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:0 1px 4px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:${fontSize}px;line-height:1;letter-spacing:0;">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function isInsideCampus(latlng) {
  const [lat, lng] = latlng;
  return (
    lat >= CAMPUS_BBOX.minLat &&
    lat <= CAMPUS_BBOX.maxLat &&
    lng >= CAMPUS_BBOX.minLng &&
    lng <= CAMPUS_BBOX.maxLng
  );
}

function nearestNode(latlng, nodes) {
  let best = null;
  let bestD = Infinity;
  for (const [key, coord] of Object.entries(nodes)) {
    const d = haversine(latlng, [coord[1], coord[0]]);
    if (d < bestD) {
      bestD = d;
      best = key;
    }
  }
  return { key: best, dist: bestD };
}

/** Bearing in degrees 0-360 from point a to b ([lat,lng]) */
function bearing(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function cardinal(brng) {
  const dirs = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  return dirs[Math.round(brng / 45) % 8];
}

/** Turn type from previous bearing to next */
function turnType(prevBrng, nextBrng) {
  let delta = ((nextBrng - prevBrng + 540) % 360) - 180; // -180..180
  const abs = Math.abs(delta);
  if (abs < 25) return { type: "straight", phrase: "Continue straight" };
  if (abs < 60) return { type: delta > 0 ? "slight-right" : "slight-left", phrase: delta > 0 ? "Bear right" : "Bear left" };
  if (abs < 120) return { type: delta > 0 ? "right" : "left", phrase: delta > 0 ? "Turn right" : "Turn left" };
  return { type: delta > 0 ? "sharp-right" : "sharp-left", phrase: delta > 0 ? "Sharp right" : "Sharp left" };
}

/**
 * Build clearer step list from a path of [lat,lng] points and destination name.
 * Samples the path and emits a step when direction changes meaningfully.
 */
function buildStepsFromPath(coords, destinationName) {
  if (!coords || coords.length < 2) {
    return [{ instruction: `Head to ${destinationName}`, distance: 0, type: "depart" }];
  }

  // Simplify: keep points at least ~18m apart for stable bearings
  const simplified = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    if (haversine(simplified[simplified.length - 1], coords[i]) >= 18) {
      simplified.push(coords[i]);
    }
  }
  if (simplified[simplified.length - 1] !== coords[coords.length - 1]) {
    simplified.push(coords[coords.length - 1]);
  }

  const steps = [];
  // Depart
  const firstBrng = bearing(simplified[0], simplified[Math.min(1, simplified.length - 1)]);
  let segStartIdx = 0;
  let segDist = 0;

  const flush = (endIdx, instruction, type) => {
    let d = 0;
    for (let i = segStartIdx; i < endIdx; i++) {
      d += haversine(simplified[i], simplified[i + 1] || simplified[i]);
    }
    d = Math.max(5, Math.round(d));
    steps.push({ instruction, distance: d, type });
    segStartIdx = endIdx;
  };

  steps.push({
    instruction: `Head ${cardinal(firstBrng)} towards ${destinationName}`,
    distance: 0, // filled below
    type: "depart"
  });

  let prevBrng = firstBrng;
  for (let i = 1; i < simplified.length - 1; i++) {
    const nextBrng = bearing(simplified[i], simplified[i + 1]);
    const turn = turnType(prevBrng, nextBrng);
    const leg = haversine(simplified[i - 1], simplified[i]);
    segDist += leg;

    if (turn.type !== "straight" && segDist >= 25) {
      // close previous leg distance on last step
      if (steps.length) {
        steps[steps.length - 1].distance = Math.max(5, Math.round(segDist));
      }
      steps.push({
        instruction: `${turn.phrase} and continue`,
        distance: 0,
        type: turn.type
      });
      segDist = 0;
      prevBrng = nextBrng;
    } else {
      prevBrng = nextBrng;
    }
  }

  // Final leg + arrive
  const lastLeg = haversine(simplified[simplified.length - 2], simplified[simplified.length - 1]);
  segDist += lastLeg;
  if (steps.length) {
    steps[steps.length - 1].distance = Math.max(5, Math.round(steps[steps.length - 1].distance || segDist));
  }

  // If only depart step, set its distance to full path
  if (steps.length === 1) {
    let total = 0;
    for (let i = 0; i < simplified.length - 1; i++) total += haversine(simplified[i], simplified[i + 1]);
    steps[0].distance = Math.max(5, Math.round(total));
  }

  steps.push({
    instruction: `Arrive at ${destinationName}`,
    distance: 0,
    type: "arrive"
  });

  // Cap to reasonable number of steps
  if (steps.length > 8) {
    const first = steps[0];
    const last = steps[steps.length - 1];
    const mid = steps.slice(1, -1);
    const keep = [];
    const step = Math.ceil(mid.length / 5);
    for (let i = 0; i < mid.length; i += step) keep.push(mid[i]);
    return [first, ...keep.slice(0, 5), last];
  }
  return steps;
}

function cleanOsmInstruction(raw, destinationName) {
  if (!raw || raw === "Continue") return `Continue towards ${destinationName}`;
  let s = raw.trim();
  // OSRM sometimes returns empty maneuver text
  if (!s || s.toLowerCase() === "arrive") return `Arrive at ${destinationName}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Campus graph Dijkstra (pathways for walking, roads for driving) */
function routeOnCampusGraph(fromLatLng, toLatLng, graphData, accessibleOnly, travelMode = "walking") {
  if (!graphData?.nodes || !graphData?.edges) return null;
  const { nodes } = graphData;
  const adj = {};
  for (const e of graphData.edges) {
    // Accessibility filter only applies to walking (pathways)
    if (travelMode === "walking" && accessibleOnly && !e.accessible) continue;
    if (!adj[e.from]) adj[e.from] = [];
    adj[e.from].push(e);
  }
  const start = nearestNode(fromLatLng, nodes);
  const end = nearestNode(toLatLng, nodes);
  // Snap to nearest network node (roads are sparser than pathways)
  const maxSnap = travelMode === "driving" ? 350 : 220;
  if (!start.key || !end.key || start.dist > maxSnap || end.dist > maxSnap) return null;

  const dist = {};
  const prev = {};
  const prevEdge = {};
  const pq = [];
  for (const k of Object.keys(nodes)) {
    dist[k] = Infinity;
    prev[k] = null;
    prevEdge[k] = null;
  }
  dist[start.key] = 0;
  pq.push({ key: start.key, d: 0 });

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { key: u } = pq.shift();
    if (u === end.key) break;
    if (dist[u] === Infinity) break;
    for (const e of adj[u] || []) {
      const alt = dist[u] + e.length;
      if (alt < dist[e.to]) {
        dist[e.to] = alt;
        prev[e.to] = u;
        prevEdge[e.to] = e;
        pq.push({ key: e.to, d: alt });
      }
    }
  }
  if (dist[end.key] === Infinity) return null;

  const edgeChain = [];
  let cur = end.key;
  while (prevEdge[cur]) {
    edgeChain.unshift(prevEdge[cur]);
    cur = prev[cur];
  }

  const pathCoords = [fromLatLng];
  const startCoord = nodes[start.key];
  pathCoords.push([startCoord[1], startCoord[0]]);
  for (const e of edgeChain) {
    for (const c of e.coords) pathCoords.push([c[1], c[0]]);
  }
  pathCoords.push(toLatLng);

  const totalDistance = Math.round(dist[end.key] + start.dist + end.dist);
  // ~80 m/min walking, ~400 m/min driving on campus roads
  const speedMPerMin = travelMode === "driving" ? 400 : 80;
  return {
    coords: pathCoords,
    totalDistance,
    totalTime: Math.max(1, Math.round(totalDistance / speedMPerMin)),
    steps: null, // filled by caller with destination name
    accessible: travelMode === "walking" ? true : undefined,
    mode: "campus",
    travelMode
  };
}

/** Real-world route via OSRM (free, no API key) – outside campus */
async function routeOSRM(fromLatLng, toLatLng, travelMode = "walking") {
  const [lat1, lng1] = fromLatLng;
  const [lat2, lng2] = toLatLng;
  const profile = travelMode === "driving" ? "driving" : "foot";
  const url = `https://router.project-osrm.org/route/v1/${profile}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const r = data.routes[0];
    const coords = r.geometry.coordinates.map((c) => [c[1], c[0]]);
    const totalDistance = Math.round(r.distance);
    const totalTime = Math.max(1, Math.round(r.duration / 60));
    const rawSteps = r.legs?.[0]?.steps || [];
    let steps = rawSteps
      .filter((s) => (s.distance || 0) > 8 || (s.maneuver && s.maneuver.type === "arrive"))
      .slice(0, 10)
      .map((s) => {
        const m = s.maneuver || {};
        let instruction = m.instruction || "";
        if (!instruction) {
          const type = m.type || "";
          const modifier = m.modifier || "";
          if (type === "depart") instruction = "Head towards your destination";
          else if (type === "arrive") instruction = "Arrive at destination";
          else if (type === "turn") instruction = `Turn ${modifier || ""}`.trim();
          else if (type === "new name" || type === "continue") instruction = s.name ? `Continue on ${s.name}` : "Continue straight";
          else instruction = s.name ? `Continue on ${s.name}` : "Continue";
        }
        return {
          instruction: instruction.charAt(0).toUpperCase() + instruction.slice(1),
          distance: Math.round(s.distance || 0),
          type: m.type || "continue"
        };
      });
    if (!steps.length) {
      steps = buildStepsFromPath(coords, "destination");
    }
    return {
      coords,
      totalDistance,
      totalTime,
      steps,
      accessible: true,
      mode: "outside",
      travelMode
    };
  } catch {
    return null;
  }
}

/**
 * Hybrid routing:
 * - Walking → campus PATHWAYS graph (pathway-graph.json) inside campus
 * - Driving → campus ROADS graph (roads-graph.json) inside campus
 * - Outside / mixed → OSRM (foot or driving profile matching travel mode)
 */
async function hybridRoute(fromLatLng, toLatLng, graphData, accessibleOnly, destinationName = "destination", travelMode = "walking") {
  const fromIn = isInsideCampus(fromLatLng);
  const toIn = isInsideCampus(toLatLng);
  const name = destinationName || "destination";
  const speedMPerMin = travelMode === "driving" ? 400 : 80;

  const withNamedSteps = (result) => {
    if (!result) return null;
    if (!result.steps || result.steps === null) {
      result.steps = buildStepsFromPath(result.coords, name);
    } else {
      // Improve arrive / depart wording with real place name
      result.steps = result.steps.map((s) => {
        let instruction = s.instruction || "";
        if (s.type === "arrive" || /arrive/i.test(instruction)) {
          instruction = `Arrive at ${name}`;
        } else if (s.type === "depart" || /head towards your destination/i.test(instruction)) {
          instruction = instruction.includes(name) ? instruction : `Head towards ${name}`;
        } else if (/destination/i.test(instruction) && name !== "destination") {
          instruction = instruction.replace(/destination/gi, name);
        }
        return { ...s, instruction };
      });
    }
    result.travelMode = travelMode;
    return result;
  };

  // Both on campus → MUST use the mode-specific campus network only.
  // Do NOT fall back to OSRM here — that made walking & driving look the same.
  if (fromIn && toIn) {
    const campus = withNamedSteps(
      routeOnCampusGraph(fromLatLng, toLatLng, graphData, accessibleOnly, travelMode)
    );
    if (campus) return campus;

    // Graph miss: still mode-specific estimate (different time for walk vs drive)
    const dist = Math.round(haversine(fromLatLng, toLatLng));
    return {
      coords: [fromLatLng, toLatLng],
      totalDistance: dist,
      totalTime: Math.max(1, Math.round(dist / speedMPerMin)),
      steps: [
        {
          instruction:
            travelMode === "driving"
              ? `Drive towards ${name} (campus roads)`
              : `Walk towards ${name} (campus pathways)`,
          distance: Math.round(dist * 0.85),
          type: "depart"
        },
        { instruction: `Arrive at ${name}`, distance: 0, type: "arrive" }
      ],
      accessible: travelMode === "walking",
      mode: "campus",
      travelMode
    };
  }

  // Outside or mixed → OSRM (foot for walking, driving for cars)
  const osrm = withNamedSteps(await routeOSRM(fromLatLng, toLatLng, travelMode));
  if (osrm) return osrm;

  // Last resort outside campus
  const dist = Math.round(haversine(fromLatLng, toLatLng));
  return {
    coords: [fromLatLng, toLatLng],
    totalDistance: dist,
    totalTime: Math.max(1, Math.round(dist / speedMPerMin)),
    steps: [
      { instruction: `Head towards ${name}`, distance: Math.round(dist * 0.85), type: "depart" },
      { instruction: `Arrive at ${name}`, distance: 0, type: "arrive" }
    ],
    accessible: true,
    mode: "direct",
    travelMode
  };
}

function RecenterMap({ center, zoom, once }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!center) return;
    if (once && done.current) return;
    map.setView(center, zoom || map.getZoom());
    done.current = true;
  }, [center, zoom, map, once]);
  return null;
}

function LiveLocationController({ position, follow, zoomIn = false, heading = null }) {
  const map = useMap();
  const didZoom = useRef(false);
  useEffect(() => {
    if (!follow || !position) return;
    const targetZoom = zoomIn ? Math.max(map.getZoom(), 18) : map.getZoom();
    if (zoomIn && !didZoom.current) {
      map.setView(position, targetZoom, { animate: true });
      didZoom.current = true;
    } else {
      map.panTo(position, { animate: true });
    }
  }, [position, follow, zoomIn, map]);
  // Soft “heading-up” feel: keep user centred; arrow on marker shows direction
  useEffect(() => {
    if (!follow) didZoom.current = false;
  }, [follow]);
  return null;
}

function App() {
  const [places, setPlaces] = useState([]);
  const [buildingsGeo, setBuildingsGeo] = useState(null);
  const [boundaryGeo, setBoundaryGeo] = useState(null);
  const [pathwayGraph, setPathwayGraph] = useState(null);
  const [roadsGraph, setRoadsGraph] = useState(null);
  /** "walking" → PATHWAYS graph; "driving" → ROADS graph — null until user chooses */
  const [travelMode, setTravelMode] = useState(() => {
    try {
      const m = localStorage.getItem("ul_nav_travel_mode");
      return m === "walking" || m === "driving" ? m : null;
    } catch {
      return null;
    }
  });
  /** Ask walking vs driving before a route is calculated / navigation starts */
  const [showModeBeforeNav, setShowModeBeforeNav] = useState(false);
  /** Pending destination while waiting for walking/driving choice */
  const [pendingNavPlace, setPendingNavPlace] = useState(null);
  /** Why the mode prompt is open: plan route only, or start navigation after */
  const [modePromptIntent, setModePromptIntent] = useState("plan"); // "plan" | "navigate"

  const [view, setView] = useState("map"); // map | search | route | navigate | favourites | profile | events | admin
  const [accessibilityOn, setAccessibilityOn] = useState(true);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("ul_nav_theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [route, setRoute] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStep, setNavStep] = useState(0);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [routing, setRouting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(2026, 8, 1); // Sep 2026
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedEventDate, setSelectedEventDate] = useState(null); // YYYY-MM-DD or null = upcoming
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Managed events (admin can edit) + analytics + rating
  const [campusEvents, setCampusEvents] = useState(() => {
    try {
      const raw = localStorage.getItem("ul_nav_events");
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return CAMPUS_EVENTS;
  });
  const [appStats, setAppStats] = useState(() => {
    try {
      const raw = localStorage.getItem("ul_nav_stats");
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { appSessions: 0, studentLogins: [], lastOpen: null };
  });
  const [userFeedback, setUserFeedback] = useState(() => {
    try {
      const raw = localStorage.getItem("ul_nav_feedback");
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  });
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComplaint, setRatingComplaint] = useState("");
  const [ratingRouteInfo, setRatingRouteInfo] = useState(null);
  const [adminTab, setAdminTab] = useState("overview"); // overview | events | feedback
  const [editingEvent, setEditingEvent] = useState(null);
  const arrivedTriggeredRef = useRef(false);
  const [nearDestination, setNearDestination] = useState(false);

  // FROM / TO – place-to-place without live GPS
  const [fromPlace, setFromPlace] = useState(null); // null = use live location
  const [toPlace, setToPlace] = useState(null);
  const [picking, setPicking] = useState(null); // 'from' | 'to' | null
  const [useLiveAsFrom, setUseLiveAsFrom] = useState(true);

  const [userPos, setUserPos] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [followUser, setFollowUser] = useState(false);
  const [userHeading, setUserHeading] = useState(null); // degrees 0-360, null if unknown
  const watchId = useRef(null);
  const lastPosRef = useRef(null);

  // Favourites (place ids) + student profile (localStorage)
  const [favourites, setFavourites] = useState(() => {
    try {
      const raw = localStorage.getItem("ul_nav_favourites");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const raw = localStorage.getItem("ul_nav_profile");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [profileForm, setProfileForm] = useState({
    role: "student", // student | admin
    studentNumber: "",
    fullName: "",
    email: "",
    phone: "",
    faculty: "",
    yearOfStudy: "",
    department: "",
    password: "",
    confirmPassword: ""
  });
  const [profileMode, setProfileMode] = useState(() => {
    try {
      const raw = localStorage.getItem("ul_nav_profile");
      return raw ? "view" : "login";
    } catch {
      return "login";
    }
  }); // view | edit | register | login
  const [profileMessage, setProfileMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emptyProfileForm = (role = "student") => ({
    role,
    studentNumber: "",
    fullName: "",
    email: "",
    phone: "",
    faculty: "",
    yearOfStudy: "",
    department: "",
    password: "",
    confirmPassword: ""
  });

  const isStrongPassword = (pwd) => {
    if (!pwd || pwd.length < 8) return false;
    if (!/[a-z]/.test(pwd)) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    if (!/[^A-Za-z0-9]/.test(pwd)) return false;
    return true;
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  };

  const isValidStudentNumber = (sn) => /^20\d{7,9}$/.test(sn) || /^\d{8,10}$/.test(sn);

  const isValidAdminId = (id) => /^[A-Z0-9]{4,16}$/.test(id);

  const isValidFullName = (name) => {
    const n = (name || "").trim();
    return n.length >= 2 && /^[a-zA-ZÀ-ÿ\s\-'.]+$/.test(n);
  };

  const accountKey = (role, id) => `${role}:${(id || "").trim().toUpperCase()}`;

  const loadAccounts = () => {
    try {
      const raw = localStorage.getItem("ul_nav_accounts");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveAccount = (profile) => {
    try {
      const accounts = loadAccounts();
      const key = accountKey(profile.role || "student", profile.studentNumber);
      accounts[key] = profile;
      localStorage.setItem("ul_nav_accounts", JSON.stringify(accounts));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = [pos.coords.latitude, pos.coords.longitude];
        // Prefer browser compass heading when available
        if (typeof pos.coords.heading === "number" && !Number.isNaN(pos.coords.heading) && pos.coords.heading >= 0) {
          setUserHeading(pos.coords.heading);
        } else if (lastPosRef.current) {
          const moved = haversine(lastPosRef.current, next);
          if (moved >= 4) {
            setUserHeading(bearing(lastPosRef.current, next));
          }
        }
        lastPosRef.current = next;
        setUserPos(next);
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message || "Location unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  // Device orientation compass (when supported) for a stable heading arrow
  useEffect(() => {
    const onOrient = (e) => {
      // webkitCompassHeading is iOS; alpha is absolute on some Android devices
      let h = null;
      if (typeof e.webkitCompassHeading === "number") {
        h = e.webkitCompassHeading;
      } else if (typeof e.alpha === "number" && e.absolute) {
        h = (360 - e.alpha) % 360;
      }
      if (h != null && !Number.isNaN(h)) setUserHeading(h);
    };
    window.addEventListener("deviceorientationabsolute", onOrient, true);
    window.addEventListener("deviceorientation", onOrient, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrient, true);
      window.removeEventListener("deviceorientation", onOrient, true);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/buildings.json").then((r) => r.json()),
      fetch("/Buildings.geojson").then((r) => r.json()).catch(() => null),
      fetch("/Boundary.geojson").then((r) => r.json()).catch(() => null),
      fetch("/pathway-graph.json").then((r) => r.json()).catch(() => null),
      fetch("/roads-graph.json").then((r) => r.json()).catch(() => null)
    ]).then(([placesData, buildings, boundary, pathwayG, roadsG]) => {
      setPlaces(placesData || []);
      setBuildingsGeo(buildings);
      setBoundaryGeo(boundary);
      setPathwayGraph(pathwayG);
      setRoadsGraph(roadsG);
    });
  }, []);

  // Persist favourites
  useEffect(() => {
    try {
      localStorage.setItem("ul_nav_favourites", JSON.stringify(favourites));
    } catch { /* ignore */ }
  }, [favourites]);

  // Persist profile
  useEffect(() => {
    try {
      if (userProfile) localStorage.setItem("ul_nav_profile", JSON.stringify(userProfile));
      else localStorage.removeItem("ul_nav_profile");
    } catch { /* ignore */ }
  }, [userProfile]);

  // Persist events, stats, feedback
  useEffect(() => {
    try {
      localStorage.setItem("ul_nav_events", JSON.stringify(campusEvents));
    } catch { /* ignore */ }
  }, [campusEvents]);

  useEffect(() => {
    try {
      localStorage.setItem("ul_nav_stats", JSON.stringify(appStats));
    } catch { /* ignore */ }
  }, [appStats]);

  useEffect(() => {
    try {
      localStorage.setItem("ul_nav_feedback", JSON.stringify(userFeedback));
    } catch { /* ignore */ }
  }, [userFeedback]);

  // Count app session once on load
  useEffect(() => {
    setAppStats((s) => ({
      ...s,
      appSessions: (s.appSessions || 0) + 1,
      lastOpen: new Date().toISOString()
    }));
  }, []);

  // Theme (light / dark)
  useEffect(() => {
    try {
      localStorage.setItem("ul_nav_theme", theme);
    } catch { /* ignore */ }
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Ensure a default admin account exists (sign-in only — no public registration)
  useEffect(() => {
    try {
      const accounts = loadAccounts();
      const key = accountKey("admin", "ADM001");
      if (!accounts[key]) {
        accounts[key] = {
          role: "admin",
          studentNumber: "ADM001",
          fullName: "Campus Administrator",
          email: "admin@ul.ac.za",
          phone: "",
          department: "Campus Services",
          password: "Admin@2026",
          registeredAt: new Date().toISOString()
        };
        localStorage.setItem("ul_nav_accounts", JSON.stringify(accounts));
      }
    } catch { /* ignore */ }
  }, []);

  // Sync form only when navigating TO the profile view (not on every keystroke)
  const prevViewRef = useRef(view);
  useEffect(() => {
    const enteredProfile = view === "profile" && prevViewRef.current !== "profile";
    prevViewRef.current = view;
    if (!enteredProfile) return;

    if (userProfile) {
      setProfileForm({
        role: userProfile.role || "student",
        studentNumber: userProfile.studentNumber || "",
        fullName: userProfile.fullName || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        faculty: userProfile.faculty || "",
        yearOfStudy: userProfile.yearOfStudy || "",
        department: userProfile.department || ""
      });
      setProfileMode("view");
    } else {
      setProfileForm(emptyProfileForm("student"));
      setProfileMode("login");
    }
    setProfileMessage("");
  }, [view, userProfile]);

  const isFavourite = useCallback(
    (placeId) => favourites.includes(placeId),
    [favourites]
  );

  const toggleFavourite = useCallback((placeId) => {
    setFavourites((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  }, []);

  const favouritePlaces = useMemo(
    () => places.filter((p) => favourites.includes(p.id)),
    [places, favourites]
  );

  const handleGuestContinue = () => {
    const fullName = (profileForm.fullName || "").trim();
    const phone = (profileForm.phone || "").trim();
    const email = (profileForm.email || "").trim();

    if (!isValidFullName(fullName)) {
      setProfileMessage("Enter your name and surname (letters only).");
      return;
    }
    if (!phone && !email) {
      setProfileMessage("Enter a phone number or email so we can contact you if needed.");
      return;
    }
    if (phone && !isValidPhone(phone)) {
      setProfileMessage("Enter a valid phone number (10–15 digits).");
      return;
    }
    if (email && !isValidEmail(email)) {
      setProfileMessage("Enter a valid email address.");
      return;
    }

    const guestId = `GUEST-${Date.now().toString(36).toUpperCase()}`;
    const profile = {
      role: "guest",
      studentNumber: guestId,
      fullName,
      email,
      phone,
      registeredAt: new Date().toISOString()
    };
    setUserProfile(profile);
    setProfileMode("view");
    setProfileMessage("Welcome, guest!");
    setView("map");
  };

  const handleRegister = () => {
    // Public registration is students only — admins are provisioned, not self-registered
    if (profileForm.role === "admin") {
      setProfileMessage("Administrator accounts cannot be created here. Please sign in with staff credentials.");
      setProfileMode("login");
      return;
    }
    const role = "student";
    const sn = (profileForm.studentNumber || "").trim().toUpperCase();
    const fullName = (profileForm.fullName || "").trim();
    const email = (profileForm.email || "").trim();
    const phone = (profileForm.phone || "").trim();
    const password = profileForm.password || "";
    const confirmPassword = profileForm.confirmPassword || "";

    if (!isValidStudentNumber(sn)) {
      setProfileMessage("Enter a valid student number (e.g. 202012345 — 8 to 11 digits).");
      return;
    }

    if (!isValidFullName(fullName)) {
      setProfileMessage("Enter a valid full name (letters only, at least 2 characters).");
      return;
    }

    if (!email) {
      setProfileMessage("Email is required.");
      return;
    }
    if (!isValidEmail(email)) {
      setProfileMessage("Enter a valid email address (e.g. name@ul.ac.za).");
      return;
    }

    if (phone && !isValidPhone(phone)) {
      setProfileMessage("Enter a valid phone number (10–15 digits).");
      return;
    }

    if (role === "student") {
      const year = (profileForm.yearOfStudy || "").trim();
      if (year && !/^[1-6]$/.test(year)) {
        setProfileMessage("Year of study must be a number from 1 to 6.");
        return;
      }
    }

    if (!isStrongPassword(password)) {
      setProfileMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
      );
      return;
    }
    if (password !== confirmPassword) {
      setProfileMessage("Passwords do not match.");
      return;
    }

    const accounts = loadAccounts();
    const key = accountKey(role, sn);
    if (accounts[key]) {
      setProfileMessage(
        role === "admin"
          ? "An administrator account with this ID already exists. Please sign in."
          : "A student account with this number already exists. Please sign in."
      );
      setProfileMode("login");
      return;
    }

    const profile = {
      role,
      studentNumber: sn,
      fullName,
      email,
      phone,
      faculty: role === "student" ? (profileForm.faculty || "").trim() : "",
      yearOfStudy: role === "student" ? (profileForm.yearOfStudy || "").trim() : "",
      department: role === "admin" ? (profileForm.department || "").trim() : "",
      password,
      registeredAt: new Date().toISOString()
    };
    saveAccount(profile);
    // Session profile without exposing password in memory display unnecessarily
    const { password: _pw, ...sessionProfile } = profile;
    setUserProfile({ ...sessionProfile, password: profile.password });
    setProfileMode("view");
    setProfileForm((f) => ({ ...f, password: "", confirmPassword: "" }));
    if (role === "admin") {
      setProfileMessage("Administrator account created successfully.");
      setView("admin");
      setAdminTab("overview");
    } else {
      setAppStats((s) => ({
        ...s,
        studentLogins: [
          ...(s.studentLogins || []),
          { id: sn, name: profile.fullName, at: new Date().toISOString(), type: "register" }
        ]
      }));
      setProfileMessage("Student account created successfully. Welcome!");
      setView("map");
    }
  };

  const handleLogin = () => {
    const role = profileForm.role === "admin" ? "admin" : "student";
    const sn = (profileForm.studentNumber || "").trim().toUpperCase();
    const password = profileForm.password || "";

    if (!sn) {
      setProfileMessage(
        role === "admin"
          ? "Enter your admin / staff ID to continue."
          : "Enter your student number to continue."
      );
      return;
    }
    if (!password) {
      setProfileMessage("Enter your password.");
      return;
    }

    const accounts = loadAccounts();
    const key = accountKey(role, sn);
    let saved = accounts[key];

    // Migrate legacy single-profile storage if needed
    if (!saved) {
      try {
        const raw = localStorage.getItem("ul_nav_profile");
        if (raw) {
          const legacy = JSON.parse(raw);
          const legacyRole = legacy.role || "student";
          if (legacy.studentNumber === sn && legacyRole === role) {
            saved = { ...legacy, role: legacyRole };
            saveAccount(saved);
          }
        }
      } catch { /* ignore */ }
    }

    if (!saved) {
      setProfileMessage(
        role === "admin"
          ? "No administrator account found for this ID. Please register."
          : "No student account found for this number. Please register."
      );
      setProfileMode("register");
      return;
    }

    // Legacy accounts without password: allow setting password on first login attempt only if empty
    if (saved.password) {
      if (saved.password !== password) {
        setProfileMessage("Incorrect password. Please try again.");
        return;
      }
    } else {
      // Force re-register message for old accounts without password
      if (!isStrongPassword(password)) {
        setProfileMessage(
          "This account has no password yet. Register again or set a strong password by creating a new account."
        );
        return;
      }
      saved = { ...saved, password };
      saveAccount(saved);
    }

    setUserProfile(saved);
    setProfileMode("view");
    setProfileForm((f) => ({ ...f, password: "", confirmPassword: "" }));
    if (role === "admin") {
      setProfileMessage("Welcome back, Administrator!");
      setView("admin");
      setAdminTab("overview");
    } else {
      setAppStats((s) => ({
        ...s,
        studentLogins: [
          ...(s.studentLogins || []),
          { id: sn, name: saved.fullName || sn, at: new Date().toISOString(), type: "login" }
        ]
      }));
      setProfileMessage("Welcome back!");
      setView("map");
    }
  };

  const handleSaveProfile = () => {
    const fullName = (profileForm.fullName || "").trim();
    const email = (profileForm.email || "").trim();
    const phone = (profileForm.phone || "").trim();

    if (!isValidFullName(fullName)) {
      setProfileMessage("Enter a valid full name (letters only, at least 2 characters).");
      return;
    }
    if (!email) {
      setProfileMessage("Email is required.");
      return;
    }
    if (!isValidEmail(email)) {
      setProfileMessage("Enter a valid email address (e.g. name@ul.ac.za).");
      return;
    }
    if (phone && !isValidPhone(phone)) {
      setProfileMessage("Enter a valid phone number (10–15 digits).");
      return;
    }

    const role = userProfile?.role || "student";
    if (role === "student") {
      const year = (profileForm.yearOfStudy || "").trim();
      if (year && !/^[1-6]$/.test(year)) {
        setProfileMessage("Year of study must be a number from 1 to 6.");
        return;
      }
    }

    const updated = {
      ...userProfile,
      role,
      fullName,
      email,
      phone,
      faculty: role === "student" ? (profileForm.faculty || "").trim() : (userProfile.faculty || ""),
      yearOfStudy: role === "student" ? (profileForm.yearOfStudy || "").trim() : (userProfile.yearOfStudy || ""),
      department: role === "admin" ? (profileForm.department || "").trim() : (userProfile.department || ""),
      updatedAt: new Date().toISOString()
    };
    saveAccount(updated);
    setUserProfile(updated);
    setProfileMode("view");
    setProfileMessage("Profile updated.");
  };

  const handleLogout = () => {
    setUserProfile(null);
    setProfileForm(emptyProfileForm("student"));
    setProfileMode("login");
    setProfileMessage("You have been signed out.");
    setView("map");
    setAdminTab("overview");
  };

  const openRatingPrompt = (routeInfo) => {
    setRatingRouteInfo(routeInfo || null);
    setRatingValue(0);
    setRatingComplaint("");
    setShowRating(true);
  };

  const submitRating = (forcedValue = null, forcedComplaint = null) => {
    const value = forcedValue != null ? forcedValue : ratingValue;
    const complaintText = forcedComplaint != null ? forcedComplaint : ratingComplaint;
    if (!value) {
      return;
    }
    if (value < 2 && !(complaintText || "").trim()) {
      return; // complaint required for low ratings
    }
    const entry = {
      id: `fb-${Date.now()}`,
      rating: value,
      complaint: value < 2 ? (complaintText || "").trim() : "",
      routeFrom: ratingRouteInfo?.from || null,
      routeTo: ratingRouteInfo?.to || null,
      userId: userProfile?.studentNumber || "guest",
      userName: userProfile?.fullName || "Guest",
      userRole: userProfile?.role || "guest",
      at: new Date().toISOString()
    };
    setUserFeedback((prev) => [entry, ...prev].slice(0, 200));
    setShowRating(false);
    setRatingValue(0);
    setRatingComplaint("");
    setRatingRouteInfo(null);
  };

  /** Tap a star: 2–5 auto-submit; 1-star still needs a short complaint */
  const handleStarSelect = (n) => {
    setRatingValue(n);
    if (n >= 2) {
      // Auto-submit good ratings immediately — no extra "Submit" tap
      submitRating(n, "");
    }
  };

  const completeNavigationArrived = () => {
    const info = route
      ? {
          from: route.from?.name || (useLiveAsFrom ? "Live location" : "Start"),
          to: route.to?.name || "Destination"
        }
      : null;
    setIsNavigating(false);
    setNavStep(0);
    setView("map");
    setShowRoutePanel(false);
    arrivedTriggeredRef.current = false;
    setNearDestination(false);
    openRatingPrompt(info);
    // keep route briefly cleared after rating opens
    setTimeout(() => {
      setRoute(null);
      setSelectedPlace(null);
    }, 0);
  };

  const filteredPlaces = useMemo(() => {
    let list = places;
    if (activeCategory && activeCategory !== "all") {
      list = list.filter((p) => placeCategory(p) === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.code || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.type || "").toLowerCase().includes(q)
      );
    }
    // Sort by category (with colours in legend order), then name
    const order = { academic: 0, residence: 1, support: 2, recreation: 3, commercial: 4, parking: 5 };
    return [...list].sort((a, b) => {
      const ca = order[placeCategory(a)] ?? 9;
      const cb = order[placeCategory(b)] ?? 9;
      if (ca !== cb) return ca - cb;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [places, searchQuery, activeCategory]);

  const getFromLatLng = useCallback(() => {
    if (!useLiveAsFrom && fromPlace) return [fromPlace.lat, fromPlace.lng];
    if (userPos) return userPos;
    if (fromPlace) return [fromPlace.lat, fromPlace.lng];
    return CAMPUS_CENTER;
  }, [useLiveAsFrom, fromPlace, userPos]);

  const computeRoute = useCallback(
    async (fromLL, to, toLL, modeOverride = null) => {
      const mode = modeOverride || travelMode;
      if (!mode) return null; // must choose walking or driving first
      setRouting(true);
      try {
        // Walking → pathways graph; Driving → roads graph
        const graphData = mode === "driving" ? roadsGraph : pathwayGraph;
        const result = await hybridRoute(
          fromLL,
          toLL,
          graphData,
          accessibilityOn,
          to.name,
          mode
        );
        return {
          from: useLiveAsFrom && userPos
            ? { name: "Your live location", lat: fromLL[0], lng: fromLL[1] }
            : fromPlace
              ? { name: fromPlace.name, lat: fromPlace.lat, lng: fromPlace.lng }
              : { name: "Start", lat: fromLL[0], lng: fromLL[1] },
          to,
          ...result
        };
      } finally {
        setRouting(false);
      }
    },
    [pathwayGraph, roadsGraph, travelMode, accessibilityOn, useLiveAsFrom, userPos, fromPlace]
  );

  const handleSelectPlace = async (place) => {
    // If user is picking FROM or TO in route planner
    if (picking === "from") {
      setFromPlace(place);
      setUseLiveAsFrom(false);
      setSearchQuery("");
      if (toPlace) {
        // Both ends set → ask walking/driving then navigate
        setPicking(null);
        setPendingNavPlace(toPlace);
        setModePromptIntent("navigate");
        setShowModeBeforeNav(true);
        setView("map");
      } else {
        // Immediately open destination picker (no manual step)
        setPicking("to");
        setView("search");
      }
      return;
    }
    if (picking === "to") {
      setToPlace(place);
      setPicking(null);
      setSearchQuery("");
      setPendingNavPlace(place);
      // Always navigate after mode choice to save taps
      setModePromptIntent("navigate");
      setShowModeBeforeNav(true);
      setView("map");
      return;
    }

    // Default: navigate here — ask walking vs driving then start immediately
    setSelectedPlace(place);
    setToPlace(place);
    setFollowUser(false);
    setPendingNavPlace(place);
    setModePromptIntent("navigate");
    setShowModeBeforeNav(true);
    if (isMobile) setView("map");
  };

  const swapFromTo = async () => {
    if (!toPlace && !fromPlace) return;
    const newFrom = toPlace;
    const newTo = fromPlace;
    setFromPlace(newFrom);
    setToPlace(newTo);
    setUseLiveAsFrom(false);
    if (newFrom && newTo) {
      if (!travelMode) {
        setPendingNavPlace(newTo);
        setModePromptIntent("navigate");
        setShowModeBeforeNav(true);
        return;
      }
      const r = await computeRoute([newFrom.lat, newFrom.lng], newTo, [newTo.lat, newTo.lng], travelMode);
      setRoute(r);
      setShowRoutePanel(true);
    }
  };

  const useMyLocationAsFrom = async () => {
    setUseLiveAsFrom(true);
    setFromPlace(null);
    if (toPlace && userPos) {
      if (!travelMode) {
        setPendingNavPlace(toPlace);
        setModePromptIntent("navigate");
        setShowModeBeforeNav(true);
        return;
      }
      const r = await computeRoute(userPos, toPlace, [toPlace.lat, toPlace.lng], travelMode);
      setRoute(r);
      setShowRoutePanel(true);
    }
  };

  /** Start navigation immediately using the mode already chosen for this route */
  const startNavigation = () => {
    if (!route && !toPlace) return;
    const mode = travelMode || route?.travelMode;
    // Mode already known from planning — go straight into navigation
    if (mode && route) {
      setIsNavigating(true);
      setNavStep(0);
      setView("navigate");
      setShowRoutePanel(false);
      setFollowUser(!!userPos && useLiveAsFrom);
      arrivedTriggeredRef.current = false;
      setNearDestination(false);
      return;
    }
    // Fallback: ask for mode only if somehow missing
    setPendingNavPlace(toPlace || route?.to || null);
    setModePromptIntent("navigate");
    setShowModeBeforeNav(true);
  };

  /**
   * After user picks walking or driving:
   * rebuild route on the correct network (pathways vs roads) → different distance & time
   */
  const confirmTravelModeAndStart = async (mode) => {
    setTravelMode(mode);
    try {
      localStorage.setItem("ul_nav_travel_mode", mode);
    } catch { /* ignore */ }
    const dest = pendingNavPlace || toPlace || route?.to;
    if (!dest) {
      setShowModeBeforeNav(false);
      return;
    }
    setToPlace(dest);
    setPendingNavPlace(null);
    setRouting(true);

    const fromLL = getFromLatLng();
    const toLL = [dest.lat, dest.lng];
    // Pass mode explicitly so we don't rely on state that hasn't flushed yet
    const r = await computeRoute(fromLL, dest, toLL, mode);
    setRouting(false);
    setShowModeBeforeNav(false);
    if (!r) return;
    setRoute(r);

    // Always start navigation after mode choice to save the user a tap
    setShowRoutePanel(false);
    setIsNavigating(true);
    setNavStep(0);
    setView("navigate");
    setFollowUser(true);
    arrivedTriggeredRef.current = false;
    setNearDestination(false);
  };

  const endNavigation = () => {
    // Treat ending navigation as arrival → rating prompt
    if (route) {
      completeNavigationArrived();
      return;
    }
    setIsNavigating(false);
    setNavStep(0);
    setView("map");
    setRoute(null);
    setSelectedPlace(null);
    setShowRoutePanel(false);
    arrivedTriggeredRef.current = false;
  };

  // Detect when user is near destination — only then show "I've arrived"
  useEffect(() => {
    if (!isNavigating || !route?.to || !userPos) {
      if (!isNavigating) setNearDestination(false);
      return;
    }
    const toLat = route.to.lat;
    const toLng = route.to.lng;
    if (toLat == null || toLng == null) return;
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(toLat - userPos[0]);
    const dLng = toRad(toLng - userPos[1]);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(userPos[0])) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
    const dist = 2 * R * Math.asin(Math.sqrt(a));
    setNearDestination(dist <= 45);
  }, [userPos, isNavigating, route]);

  // Must stay above any early returns (auth landing, etc.) — Rules of Hooks
  const uniqueStudentLogins = useMemo(() => {
    const ids = new Set();
    (appStats.studentLogins || []).forEach((l) => {
      if (l.id) ids.add(l.id);
    });
    return ids.size;
  }, [appStats.studentLogins]);

  const avgRating = useMemo(() => {
    if (!userFeedback.length) return null;
    const sum = userFeedback.reduce((a, f) => a + (f.rating || 0), 0);
    return (sum / userFeedback.length).toFixed(1);
  }, [userFeedback]);

  const buildingStyle = (feature) => {
    const t = (feature.properties?.Type || "").toLowerCase();
    const n = `${feature.properties?.Name || ""} ${feature.properties?.OtherName || ""}`.toLowerCase();
    // Category fills aligned with marker colours
    let fill = CATEGORY_COLORS.support;
    let stroke = UL_NAVY;
    if (t.includes("park") || n.includes("parking") || t.includes("vehicle")) {
      fill = CATEGORY_COLORS.parking;
      stroke = "#475569";
    } else if (t.includes("resid") || t.includes("residance")) {
      fill = CATEGORY_COLORS.residence;
    } else if (
      t.includes("lectur") || t.includes("lab") || t.includes("science") ||
      t.includes("hall") || t.includes("academic") || t.includes("research") || t.includes("library")
    ) {
      fill = CATEGORY_COLORS.academic;
    } else if (t.includes("recreat") || t.includes("sport") || t.includes("gym")) {
      fill = CATEGORY_COLORS.recreation;
    } else if (t.includes("commerc") || t.includes("shop") || t.includes("restaurant")) {
      fill = CATEGORY_COLORS.commercial;
    } else if (t.includes("support") || t.includes("medic") || t.includes("health")) {
      fill = CATEGORY_COLORS.support;
    }
    return {
      fillColor: fill,
      weight: 1,
      opacity: 0.9,
      color: stroke,
      fillOpacity: 0.45
    };
  };

  // Render helpers (not nested components) so controlled inputs keep focus
  const renderSearchPanel = (embedded = false) => (
    <div className={`search-panel find-places-panel ${embedded ? "embedded" : "full"}`}>
      {!embedded && (
        <div className="search-panel-header">
          <button className="icon-btn" onClick={() => {
            if (picking === "from" || picking === "to") {
              setPicking(null);
              setView("route");
            } else {
              setView("map");
              setPicking(null);
            }
          }}>
            <ChevronLeft size={22} />
          </button>
          <h2>{picking === "from" ? "Choose start" : picking === "to" ? "Choose destination" : "Find Places"}</h2>
          <div style={{ width: 40 }} />
        </div>
      )}

      <div className="panel-hero search-hero">
        <div className="panel-hero-icon search">
          <Search size={22} strokeWidth={2.2} />
        </div>
        <div className="panel-hero-text">
          <h3>
            {picking === "from"
              ? "Starting point"
              : picking === "to"
                ? "Destination"
                : "Explore campus"}
          </h3>
          {picking && (
            <p>Search or filter by category, then tap a place.</p>
          )}
        </div>
        <div className="panel-hero-stat">
          <strong>{filteredPlaces.length}</strong>
          <span>places</span>
        </div>
      </div>

      <div className="search-box modern">
        <Search size={18} />
        <input
          autoFocus={!embedded}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={picking === "from" ? "Search start place..." : picking === "to" ? "Search destination..." : "Search buildings, places..."}
        />
        {searchQuery && (
          <button type="button" className="search-clear" onClick={() => setSearchQuery("")}>
            <X size={16} />
          </button>
        )}
      </div>
      <div className="cat-chips in-panel">
        {CATEGORIES.map((c) => {
          const Icon = c.Icon;
          const isActive = activeCategory === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`chip ${isActive ? "active" : ""}`}
              onClick={() => setActiveCategory(c.id)}
              style={isActive ? { background: `${c.color}18`, borderColor: c.color, color: c.color } : undefined}
            >
              <Icon size={14} strokeWidth={2.25} />
              {c.name}
            </button>
          );
        })}
      </div>
      <div className="place-list modern">
        {filteredPlaces.length === 0 && (
          <div className="empty-msg modern">
            <Search size={28} />
            <p>No places found</p>
            <span>Try another name or category</span>
          </div>
        )}
        {filteredPlaces.slice(0, 80).map((p) => {
          const cat = placeCategory(p);
          const catMeta = CATEGORIES.find((c) => c.id === cat);
          const color = catMeta?.color || CATEGORY_COLORS[cat] || UL_NAVY;
          const CatIcon = catMeta?.Icon || LayoutGrid;
          return (
          <div key={p.id} className="place-item-row modern">
            <button type="button" className="place-item modern" onClick={() => handleSelectPlace(p)}>
              <div
                className="place-icon"
                style={{
                  background: `${color}22`,
                  color
                }}
              >
                {cat === "parking" ? (
                  <span style={{ fontWeight: 800, fontSize: 13 }}>P</span>
                ) : (
                  <CatIcon size={16} strokeWidth={2.25} />
                )}
              </div>
              <div className="place-info">
                <div className="place-name">{p.name}</div>
                <div className="place-cat" style={{ color }}>
                  {cat}{p.code ? ` · ${p.code}` : ""}
                </div>
              </div>
              <ChevronRight size={16} className="place-chevron" />
            </button>
            <button
              type="button"
              className={`fav-btn ${isFavourite(p.id) ? "active" : ""}`}
              title={isFavourite(p.id) ? "Remove from favourites" : "Add to favourites"}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavourite(p.id);
              }}
            >
              <Star size={18} fill={isFavourite(p.id) ? UL_GOLD : "none"} />
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );

  const renderFavouritesPanel = (embedded = false) => (
    <div className={`search-panel favourites-panel ${embedded ? "embedded" : "full"}`}>
      {!embedded && (
        <div className="search-panel-header">
          <button className="icon-btn" onClick={() => setView("map")}>
            <ChevronLeft size={22} />
          </button>
          <h2>Favourites</h2>
          <div style={{ width: 40 }} />
        </div>
      )}

      <div className="panel-hero fav-hero">
        <div className="panel-hero-icon fav">
          <Star size={22} strokeWidth={2.2} fill={UL_GOLD} />
        </div>
        <div className="panel-hero-text">
          <h3>Saved places</h3>
          <p>Quick access to the spots you use most on campus.</p>
        </div>
        <div className="panel-hero-stat gold">
          <strong>{favouritePlaces.length}</strong>
          <span>saved</span>
        </div>
      </div>

      <div className="place-list modern">
        {favouritePlaces.length === 0 ? (
          <div className="empty-favourites modern">
            <div className="empty-fav-icon">
              <Star size={40} strokeWidth={1.5} />
            </div>
            <h3>No favourites yet</h3>
            <p>
              Tap the star on any place in Find Places or on the map to save it here for quick access.
            </p>
            <button type="button" className="btn-primary" onClick={() => setView("search")}>
              <Search size={16} /> Find places to favourite
            </button>
          </div>
        ) : (
          favouritePlaces.map((p) => {
            const cat = placeCategory(p);
            const catMeta = CATEGORIES.find((c) => c.id === cat);
            const color = catMeta?.color || CATEGORY_COLORS[cat] || UL_NAVY;
            const CatIcon = catMeta?.Icon || LayoutGrid;
            return (
            <div key={p.id} className="place-item-row modern">
              <button type="button" className="place-item modern" onClick={() => handleSelectPlace(p)}>
                <div
                  className="place-icon"
                  style={{
                    background: `${color}22`,
                    color
                  }}
                >
                  {cat === "parking" ? (
                    <span style={{ fontWeight: 800, fontSize: 13 }}>P</span>
                  ) : (
                    <CatIcon size={16} strokeWidth={2.25} />
                  )}
                </div>
                <div className="place-info">
                  <div className="place-name">{p.name}</div>
                  <div className="place-cat" style={{ color }}>
                    {cat}{p.code ? ` · ${p.code}` : ""}
                  </div>
                </div>
                <ChevronRight size={16} className="place-chevron" />
              </button>
              <button
                type="button"
                className="fav-btn active"
                title="Remove from favourites"
                onClick={() => toggleFavourite(p.id)}
              >
                <Star size={18} fill={UL_GOLD} />
              </button>
            </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Render helper (not a nested component) so inputs keep focus while typing
  const renderProfilePanel = (embedded = false) => (
    <div className={`search-panel profile-panel ${embedded ? "embedded" : "full"}`}>
      {!embedded && (
        <div className="search-panel-header">
          <button className="icon-btn" onClick={() => setView("map")}>
            <ChevronLeft size={22} />
          </button>
          <h2>Profile</h2>
          <div style={{ width: 40 }} />
        </div>
      )}

      {profileMessage && (
        <div className={`profile-msg ${profileMessage.includes("success") || profileMessage.includes("Welcome") || profileMessage.includes("updated") ? "success" : "info"}`}>
          {profileMessage}
        </div>
      )}

      {!userProfile && (profileMode === "login" || profileMode === "register") && (
        <div className="profile-auth">
          <div className="panel-hero profile-auth-hero">
            <div className="panel-hero-icon profile">
              {profileForm.role === "admin" ? <Settings size={24} strokeWidth={2.2} /> : <User size={24} strokeWidth={2.2} />}
            </div>
            <div className="panel-hero-text">
              <h3>
                {profileMode === "login"
                  ? profileForm.role === "admin"
                    ? "Admin sign in"
                    : "Student sign in"
                  : profileForm.role === "admin"
                    ? "Register as admin"
                    : "Register as student"}
              </h3>
              <p>
                {profileMode === "login"
                  ? profileForm.role === "admin"
                    ? "Sign in with your University of Limpopo admin / staff ID."
                    : "Sign in with your University of Limpopo student number."
                  : profileForm.role === "admin"
                    ? "Create an administrator account to manage campus navigation."
                    : "Create a student account for campus navigation."}
              </p>
            </div>
          </div>

          <div className="role-toggle" role="tablist" aria-label="Account type">
            <button
              type="button"
              role="tab"
              className={`role-toggle-btn ${profileForm.role === "student" ? "active" : ""}`}
              onClick={() => {
                setProfileForm((f) => ({ ...f, role: "student" }));
                setProfileMessage("");
              }}
            >
              <GraduationCap size={16} />
              Student
            </button>
            <button
              type="button"
              role="tab"
              className={`role-toggle-btn ${profileForm.role === "admin" ? "active" : ""}`}
              onClick={() => {
                setProfileForm((f) => ({ ...f, role: "admin" }));
                setProfileMessage("");
              }}
            >
              <Settings size={16} />
              Administrator
            </button>
          </div>

          <div className="profile-form-card">
            <div className="form-group">
              <label>
                <IdCard size={14} />
                {profileForm.role === "admin" ? "Admin / staff ID" : "Student number"}
              </label>
              <input
                type="text"
                placeholder={profileForm.role === "admin" ? "e.g. ADM001 or staff ID" : "e.g. 202012345"}
                value={profileForm.studentNumber}
                onChange={(e) => setProfileForm((f) => ({ ...f, studentNumber: e.target.value }))}
                autoCapitalize="characters"
              />
            </div>

            {profileMode === "register" && (
              <>
                <div className="form-group">
                  <label><User size={14} /> Full name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label><Mail size={14} /> Email (optional)</label>
                  <input
                    type="email"
                    placeholder="name@ul.ac.za"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label><Phone size={14} /> Phone (optional)</label>
                  <input
                    type="tel"
                    placeholder="0XX XXX XXXX"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                {profileForm.role === "student" ? (
                  <>
                    <div className="form-group">
                      <label><GraduationCap size={14} /> Faculty (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Science & Agriculture"
                        value={profileForm.faculty}
                        onChange={(e) => setProfileForm((f) => ({ ...f, faculty: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Year of study (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 2"
                        value={profileForm.yearOfStudy}
                        onChange={(e) => setProfileForm((f) => ({ ...f, yearOfStudy: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label><Users size={14} /> Department (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Campus Services / ICT"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm((f) => ({ ...f, department: e.target.value }))}
                    />
                  </div>
                )}
              </>
            )}

            {profileMode === "login" ? (
              <>
                <button type="button" className="btn-primary full" onClick={handleLogin}>
                  {profileForm.role === "admin" ? "Sign in as administrator" : "Sign in as student"}
                </button>
                <button
                  type="button"
                  className="text-btn profile-switch"
                  onClick={() => { setProfileMode("register"); setProfileMessage(""); }}
                >
                  Don&apos;t have an account? Register
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-primary full" onClick={handleRegister}>
                  {profileForm.role === "admin" ? "Create administrator account" : "Create student account"}
                </button>
                <button
                  type="button"
                  className="text-btn profile-switch"
                  onClick={() => { setProfileMode("login"); setProfileMessage(""); }}
                >
                  Already registered? Sign in
                </button>
              </>
            )}
          </div>

          <button type="button" className="btn-outline full profile-settings-btn" onClick={() => setShowSettings(true)}>
            <Settings size={16} /> App settings
          </button>
        </div>
      )}

      {userProfile && profileMode === "view" && (
        <div className="profile-view">
          <div className="profile-header-card modern">
            <div className="profile-avatar">
              {(userProfile.fullName || "S").charAt(0).toUpperCase()}
            </div>
            <div className="profile-header-info">
              <div className="profile-name">{userProfile.fullName}</div>
              <div className="profile-sn">
                {userProfile.role === "admin" ? "ID: " : ""}
                {userProfile.studentNumber}
              </div>
              <span className={`profile-badge ${userProfile.role === "admin" ? "admin" : userProfile.role === "guest" ? "guest" : "student"}`}>
                {userProfile.role === "admin" ? "Administrator" : userProfile.role === "guest" ? "Guest" : "Student"}
              </span>
            </div>
          </div>

          <div className="profile-stats modern">
            <button type="button" className="stat" onClick={() => setView("favourites")}>
              <strong>{favourites.length}</strong>
              <span>Favourites</span>
            </button>
            <div className="stat">
              <strong>{userProfile.registeredAt ? new Date(userProfile.registeredAt).toLocaleDateString() : "—"}</strong>
              <span>Joined</span>
            </div>
          </div>

          <div className="profile-details modern">
            <div className="profile-section-label">Details</div>
            {userProfile.email && (
              <div className="detail-row"><Mail size={16} /> {userProfile.email}</div>
            )}
            {userProfile.phone && (
              <div className="detail-row"><Phone size={16} /> {userProfile.phone}</div>
            )}
            {userProfile.role === "admin" && userProfile.department && (
              <div className="detail-row"><Users size={16} /> {userProfile.department}</div>
            )}
            {userProfile.role !== "admin" && userProfile.faculty && (
              <div className="detail-row"><GraduationCap size={16} /> {userProfile.faculty}</div>
            )}
            {userProfile.role !== "admin" && userProfile.yearOfStudy && (
              <div className="detail-row"><IdCard size={16} /> Year {userProfile.yearOfStudy}</div>
            )}
            {!userProfile.email &&
              !userProfile.phone &&
              !(userProfile.role === "admin" ? userProfile.department : userProfile.faculty) && (
              <p className="muted">No extra details yet. Edit your profile to add them.</p>
            )}
          </div>
          <div className="profile-actions modern">
            {userProfile.role === "admin" && (
              <button type="button" className="btn-primary" onClick={() => { setView("admin"); setAdminTab("overview"); }}>
                <LayoutDashboard size={16} /> Admin dashboard
              </button>
            )}
            <button type="button" className="btn-primary" onClick={() => setProfileMode("edit")}>
              <Edit3 size={16} /> Edit profile
            </button>
            <button type="button" className="btn-outline" onClick={() => setShowSettings(true)}>
              <Settings size={16} /> Settings
            </button>
            <button type="button" className="btn-outline danger" onClick={handleLogout}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      )}

      {userProfile && profileMode === "edit" && (
        <div className="profile-edit">
          <div className="panel-hero profile-edit-hero">
            <div className="panel-hero-icon profile">
              <Edit3 size={22} strokeWidth={2.2} />
            </div>
            <div className="panel-hero-text">
              <h3>Edit profile</h3>
              <p>
                {userProfile.role === "admin"
                  ? "Update your administrator details below."
                  : "Update your student details below."}
              </p>
            </div>
          </div>
          <div className="profile-form-card">
            <div className="form-group">
              <label>{userProfile.role === "admin" ? "Admin / staff ID" : "Student number"}</label>
              <input type="text" value={userProfile.studentNumber} disabled />
            </div>
            <div className="form-group">
              <label><User size={14} /> Full name</label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label><Mail size={14} /> Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label><Phone size={14} /> Phone</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            {userProfile.role === "admin" ? (
              <div className="form-group">
                <label><Users size={14} /> Department</label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm((f) => ({ ...f, department: e.target.value }))}
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label><GraduationCap size={14} /> Faculty</label>
                  <input
                    type="text"
                    value={profileForm.faculty}
                    onChange={(e) => setProfileForm((f) => ({ ...f, faculty: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Year of study</label>
                  <input
                    type="text"
                    value={profileForm.yearOfStudy}
                    onChange={(e) => setProfileForm((f) => ({ ...f, yearOfStudy: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div className="profile-actions modern">
              <button type="button" className="btn-primary" onClick={handleSaveProfile}>
                <Save size={16} /> Save changes
              </button>
              <button type="button" className="text-btn" onClick={() => setProfileMode("view")}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Calendar helpers
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstWeekday = (y, m) => new Date(y, m, 1).getDay(); // 0=Sun
  const toYMD = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const eventsOnDate = (ymd) => campusEvents.filter((e) => e.date === ymd);
  const upcomingEvents = campusEvents
    .filter((e) => e.date >= "2026-09-08")
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const filteredEvents = selectedEventDate
    ? eventsOnDate(selectedEventDate)
    : upcomingEvents;

  const goToEventPlace = (ev) => {
    const place = places.find((p) => p.id === ev.placeId || p.name === ev.location);
    setShowSettings(false);
    setSelectedEvent(null);
    if (place) {
      setSelectedPlace(place);
      setToPlace(place);
      setView("map");
    } else {
      setView("map");
    }
  };

  const renderEventsPanel = (embedded = false) => {
    const selectedDateLabel = selectedEventDate
      ? (() => {
          const [y, m, d] = selectedEventDate.split("-").map(Number);
          return `${monthNames[m - 1]} ${d}, ${y}`;
        })()
      : null;

    return (
      <div className={`search-panel events-panel ${embedded ? "embedded" : "full"}`}>
        {!embedded && (
          <div className="search-panel-header">
            <button className="icon-btn" onClick={() => setView("map")}>
              <ChevronLeft size={22} />
            </button>
            <h2>Events</h2>
            <div style={{ width: 40 }} />
          </div>
        )}

        <div className="events-hero">
          <div className="events-hero-text">
            <span className="events-hero-kicker">Campus life</span>
            <h3 className="events-hero-title">What&apos;s on</h3>
            <p className="events-hero-sub">
              Tap an event for more information.
            </p>
          </div>
          <div className="events-hero-count">
            <strong>{upcomingEvents.length}</strong>
            <span>upcoming</span>
          </div>
        </div>

        <div className="calendar-widget">
          <div className="calendar-nav">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={() =>
                setCalendarMonth((cm) => {
                  const m = cm.month - 1;
                  if (m < 0) return { year: cm.year - 1, month: 11 };
                  return { year: cm.year, month: m };
                })
              }
            >
              <ChevronLeft size={18} />
            </button>
            <strong>
              {monthNames[calendarMonth.month]} {calendarMonth.year}
            </strong>
            <button
              type="button"
              className="cal-nav-btn"
              onClick={() =>
                setCalendarMonth((cm) => {
                  const m = cm.month + 1;
                  if (m > 11) return { year: cm.year + 1, month: 0 };
                  return { year: cm.year, month: m };
                })
              }
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="calendar-grid">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="cal-dow">
                {d}
              </div>
            ))}
            {Array.from({ length: firstWeekday(calendarMonth.year, calendarMonth.month) }).map((_, i) => (
              <div key={`e${i}`} className="cal-day empty" />
            ))}
            {Array.from({ length: daysInMonth(calendarMonth.year, calendarMonth.month) }).map((_, i) => {
              const day = i + 1;
              const ymd = toYMD(calendarMonth.year, calendarMonth.month, day);
              const has = eventsOnDate(ymd).length > 0;
              const isSelected = selectedEventDate === ymd;
              const isToday = ymd === "2026-09-08";
              return (
                <button
                  key={ymd}
                  type="button"
                  className={`cal-day ${has ? "has-event" : ""} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                  onClick={() => setSelectedEventDate(isSelected ? null : ymd)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {selectedEventDate && (
            <button type="button" className="cal-clear-btn" onClick={() => setSelectedEventDate(null)}>
              Clear date · show all upcoming
            </button>
          )}
        </div>

        <div className="events-list">
          <div className="events-list-title">
            <span>{selectedDateLabel ? selectedDateLabel : "Upcoming"}</span>
            <span className="events-list-count">{filteredEvents.length}</span>
          </div>
          {filteredEvents.length === 0 && (
            <div className="events-empty">
              <Calendar size={28} />
              <p>No events on this date.</p>
              <button type="button" className="cal-clear-btn" onClick={() => setSelectedEventDate(null)}>
                View all upcoming
              </button>
            </div>
          )}
          {filteredEvents.map((ev) => (
            <button
              key={ev.id}
              type="button"
              className={`event-card cat-border-${ev.category}`}
              onClick={() => setSelectedEvent(ev)}
            >
              <div className={`event-date-badge cat-bg-${ev.category}`}>
                <span className="ev-day">{ev.date.slice(8)}</span>
                <span className="ev-mon">{monthNames[parseInt(ev.date.slice(5, 7), 10) - 1].slice(0, 3)}</span>
              </div>
              <div className="event-body">
                <div className="event-title-row">
                  <div className="event-title">{ev.title}</div>
                  <ChevronRight size={16} className="event-chevron" />
                </div>
                <div className="event-meta">
                  <span><Clock size={12} /> {ev.time}{ev.endTime ? ` – ${ev.endTime}` : ""}</span>
                  <span><MapPin size={12} /> {ev.location}</span>
                </div>
                <div className={`event-cat cat-${ev.category}`}>{ev.category}</div>
              </div>
            </button>
          ))}
        </div>

        {selectedEvent && (
          <div className="event-detail-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="event-detail-card" onClick={(e) => e.stopPropagation()}>
              <div className={`event-detail-accent cat-bg-${selectedEvent.category}`} />
              <button type="button" className="icon-btn close-ev" onClick={() => setSelectedEvent(null)}>
                <X size={20} />
              </button>
              <span className={`event-cat cat-${selectedEvent.category}`}>{selectedEvent.category}</span>
              <h3>{selectedEvent.title}</h3>
              <div className="event-detail-rows">
                <div><Calendar size={16} /> {selectedEvent.date}</div>
                <div><Clock size={16} /> {selectedEvent.time}{selectedEvent.endTime ? ` – ${selectedEvent.endTime}` : ""}</div>
                <div><MapPin size={16} /> {selectedEvent.location}</div>
              </div>
              <p>{selectedEvent.description}</p>
              <p className="muted">Open to students and guests.</p>
              <button type="button" className="btn-primary full event-map-btn" onClick={() => goToEventPlace(selectedEvent)}>
                <MapPin size={16} /> Show location on map
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /** Must choose walking or driving before navigation starts */
  const renderModeBeforeNavModal = () => {
    if (!showModeBeforeNav) return null;
    return (
      <div
        className="settings-overlay mode-before-nav-overlay"
        onClick={() => setShowModeBeforeNav(false)}
      >
        <div className="mode-before-nav-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="mode-before-nav-header">
            <h2>How are you travelling?</h2>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowModeBeforeNav(false)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mode-before-nav-actions">
            <button
              type="button"
              className="mode-before-nav-btn walk"
              disabled={routing}
              onClick={() => confirmTravelModeAndStart("walking")}
            >
              <Footprints size={28} strokeWidth={2} />
              <span className="mode-before-nav-title">Walking</span>
            </button>
            <button
              type="button"
              className="mode-before-nav-btn drive"
              disabled={routing}
              onClick={() => confirmTravelModeAndStart("driving")}
            >
              <Car size={28} strokeWidth={2} />
              <span className="mode-before-nav-title">Driving</span>
            </button>
          </div>
          {routing && (
            <div className="routing-msg modern mode-before-nav-loading">
              <div className="routing-spinner" />
              Building your route…
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettingsModal = () => {
    if (!showSettings) return null;
    return (
      <div className="settings-overlay" onClick={() => setShowSettings(false)}>
        <div className="settings-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="settings-header">
            <h2><Settings size={20} /> Settings</h2>
            <button className="icon-btn" onClick={() => setShowSettings(false)}><X size={20} /></button>
          </div>
          <div className="settings-body">
            <div className="settings-row">
              <div className="settings-row-info">
                <Settings size={20} />
                <div>
                  <strong>Appearance</strong>
                  <div className="sub">Light or dark mode for the app interface</div>
                </div>
              </div>
              <div className="theme-toggle">
                <button
                  type="button"
                  className={theme === "light" ? "active" : ""}
                  onClick={() => setTheme("light")}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={theme === "dark" ? "active" : ""}
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </button>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <Accessibility size={20} />
                <div>
                  <strong>Accessibility routes</strong>
                  <div className="sub">Prefer accessible campus pathways when available</div>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={accessibilityOn}
                  onChange={() => setAccessibilityOn(!accessibilityOn)}
                />
                <span className="slider" />
              </label>
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <Locate size={20} />
                <div>
                  <strong>Live location</strong>
                  <div className="sub">
                    {userPos ? "GPS active" : geoError || "Not available — place-to-place still works"}
                  </div>
                </div>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <MapIcon size={20} />
                <div>
                  <strong>Routing mode</strong>
                  <div className="sub">
                    {travelMode === "driving"
                      ? "Driving: campus roads · real roads outside"
                      : "Walking: campus pathways · pedestrian outside"}
                  </div>
                </div>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-info">
                <Calendar size={20} />
                <div>
                  <strong>Events calendar</strong>
                  <div className="sub">View upcoming campus events for students & guests</div>
                </div>
              </div>
              <button
                className="btn-outline small"
                onClick={() => {
                  setShowSettings(false);
                  setView("events");
                }}
              >
                Open
              </button>
            </div>
            <p className="settings-note">
              University of Limpopo Campus Navigator · Hybrid routing
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ========== AUTH LANDING (required before map) ==========
  if (!userProfile) {
    const role = profileForm.role === "admin" ? "admin" : profileForm.role === "guest" ? "guest" : "student";
    // Admin is sign-in only (no public registration)
    const isLogin = role === "admin" || profileMode !== "register";
    const isGuest = role === "guest";

    return (
      <div className="auth-landing" data-theme={theme}>
        <div className="auth-landing-bg" aria-hidden="true" />
        <div className="auth-landing-card">
          <div className="auth-brand">
            <img src="/ul-logo.jpeg" alt="University of Limpopo" className="auth-logo" />
            <div>
              <div className="auth-uni">University of Limpopo</div>
              <h1 className="auth-title">Campus Navigator</h1>
              <p className="auth-tagline">Finding solutions for Africa</p>
            </div>
          </div>

          <div className="role-toggle auth-role-toggle three" role="tablist" aria-label="Account type">
            <button
              type="button"
              role="tab"
              className={`role-toggle-btn ${role === "student" ? "active" : ""}`}
              onClick={() => {
                setProfileForm((f) => ({ ...f, role: "student" }));
                setProfileMessage("");
              }}
            >
              <GraduationCap size={15} />
              Student
            </button>
            <button
              type="button"
              role="tab"
              className={`role-toggle-btn ${role === "guest" ? "active" : ""}`}
              onClick={() => {
                setProfileForm((f) => ({ ...f, role: "guest" }));
                setProfileMode("register");
                setProfileMessage("");
              }}
            >
              <User size={15} />
              Guest
            </button>
            <button
              type="button"
              role="tab"
              className={`role-toggle-btn ${role === "admin" ? "active" : ""}`}
              onClick={() => {
                setProfileForm((f) => ({ ...f, role: "admin" }));
                setProfileMode("login");
                setProfileMessage("");
              }}
            >
              <Settings size={15} />
              Admin
            </button>
          </div>

          {!isGuest && role !== "admin" && (
            <div className="auth-mode-toggle">
              <button
                type="button"
                className={isLogin ? "active" : ""}
                onClick={() => { setProfileMode("login"); setProfileMessage(""); }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={!isLogin ? "active" : ""}
                onClick={() => { setProfileMode("register"); setProfileMessage(""); }}
              >
                Register
              </button>
            </div>
          )}

          {profileMessage && (
            <div className={`profile-msg ${profileMessage.includes("success") || profileMessage.includes("Welcome") ? "success" : "info"}`}>
              {profileMessage}
            </div>
          )}

          <div className="auth-form">
            {isGuest ? (
              <>
                <div className="form-group">
                  <label><User size={14} /> Name &amp; surname</label>
                  <input
                    type="text"
                    placeholder="e.g. Thabo Molefe"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label><Phone size={14} /> Phone</label>
                  <input
                    type="tel"
                    placeholder="0XX XXX XXXX"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label><Mail size={14} /> Email (optional if phone given)</label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <button type="button" className="btn-primary full auth-submit" onClick={handleGuestContinue}>
                  Continue as guest
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>
                    <IdCard size={14} />
                    {role === "admin" ? "Admin / staff ID" : "Student number"}
                  </label>
                  <input
                    type="text"
                    placeholder={role === "admin" ? "e.g. ADM001" : "e.g. 202012345"}
                    value={profileForm.studentNumber}
                    onChange={(e) => setProfileForm((f) => ({ ...f, studentNumber: e.target.value }))}
                    autoCapitalize="characters"
                    autoFocus
                  />
                </div>

                {!isLogin && role === "student" && (
                  <>
                    <div className="form-group">
                      <label><User size={14} /> Full name</label>
                      <input
                        type="text"
                        placeholder="e.g. Thabo Molefe"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label><Mail size={14} /> Email</label>
                      <input
                        type="email"
                        placeholder="name@ul.ac.za"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label><Phone size={14} /> Phone (optional)</label>
                      <input
                        type="tel"
                        placeholder="0XX XXX XXXX"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label><GraduationCap size={14} /> Faculty (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Science & Agriculture"
                        value={profileForm.faculty}
                        onChange={(e) => setProfileForm((f) => ({ ...f, faculty: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Year of study (optional)</label>
                      <input
                        type="text"
                        placeholder="1 – 6"
                        value={profileForm.yearOfStudy}
                        onChange={(e) => setProfileForm((f) => ({ ...f, yearOfStudy: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label><Lock size={14} /> Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "Your password" : "Create a strong password"}
                    value={profileForm.password}
                    onChange={(e) => setProfileForm((f) => ({ ...f, password: e.target.value }))}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                </div>

                {!isLogin && role === "student" && (
                  <>
                    <div className="form-group">
                      <label><Lock size={14} /> Confirm password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                        autoComplete="new-password"
                      />
                    </div>
                    <p className="password-hint">
                      Use 8+ characters with uppercase, lowercase, a number, and a special character (e.g. Campus@2026).
                    </p>
                  </>
                )}

                <label className="show-password-row">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  Show password
                </label>

                {isLogin ? (
                  <button type="button" className="btn-primary full auth-submit" onClick={handleLogin}>
                    {role === "admin" ? "Sign in as administrator" : "Sign in as student"}
                  </button>
                ) : (
                  <button type="button" className="btn-primary full auth-submit" onClick={handleRegister}>
                    Create student account
                  </button>
                )}
              </>
            )}
          </div>

          </div>
      </div>
    );
  }

  // ========== NAVIGATION MODE ==========
  if (isNavigating && route) {
    const steps = route.steps || [];
    const step = steps[Math.min(navStep, Math.max(0, steps.length - 1))] || {
      instruction: `Head to ${route.to.name}`,
      distance: route.totalDistance
    };
    const formatDist = (m) => {
      if (m == null || Number.isNaN(m)) return "—";
      if (m >= 1000) return `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km`;
      return `${Math.round(m)} m`;
    };
    const fromLabel =
      useLiveAsFrom && userPos
        ? "Your location"
        : fromPlace?.name || route.from?.name || "Start";
    const toLabel = route.to?.name || "Destination";
    const modeLabel =
      (route.travelMode === "driving" ? "Driving · " : "Walking · ") +
      (route.mode === "campus"
        ? route.travelMode === "driving"
          ? "Campus roads"
          : "Campus pathways"
        : route.mode === "outside"
          ? "Real roads"
          : "Route");
    const arrivalStr = new Date(Date.now() + (route.totalTime || 0) * 60000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    // Prefer live compass; fall back to direction along the remaining route
    let navHeading = userHeading;
    if ((navHeading == null || Number.isNaN(navHeading)) && userPos && route.coords?.length > 1) {
      let bestIdx = 0;
      let bestD = Infinity;
      for (let i = 0; i < route.coords.length; i++) {
        const d = haversine(userPos, route.coords[i]);
        if (d < bestD) {
          bestD = d;
          bestIdx = i;
        }
      }
      const lookAhead = route.coords[Math.min(bestIdx + 2, route.coords.length - 1)];
      if (lookAhead) navHeading = bearing(userPos, lookAhead);
    }

    return (
      <div className="mobile-screen nav-mode nav-fullscreen">
        {/* Full-screen map */}
        <div className="nav-map-full">
          <MapContainer center={getFromLatLng()} zoom={18} style={{ height: "100%", width: "100%" }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {buildingsGeo && <GeoJSON data={buildingsGeo} style={buildingStyle} />}
            {route.coords?.length > 1 && (
              <Polyline positions={route.coords} color={ROUTE_BLUE} weight={7} opacity={0.95} />
            )}
            {userPos && (
              <Marker
                key={`me-${Math.round((navHeading ?? -1) / 5)}`}
                position={userPos}
                icon={createYouAreHereIcon(navHeading)}
                zIndexOffset={1000}
              />
            )}
            {fromPlace && !useLiveAsFrom && (
              <Marker position={[fromPlace.lat, fromPlace.lng]} icon={createPlaceIcon(fromPlace)} />
            )}
            <Marker position={[route.to.lat, route.to.lng]} icon={createPlaceIcon(route.to, true)} />
            <LiveLocationController position={userPos} follow={followUser} zoomIn heading={navHeading} />
          </MapContainer>
        </div>

        {/* Top: close + from → to */}
        <div className="nav-overlay-top">
          <button type="button" className="nav-close-fab" onClick={endNavigation} aria-label="Close">
            <X size={20} />
          </button>
          <div className="nav-route-chip">
            <span className="chip-from">{fromLabel}</span>
            <span className="chip-arrow">→</span>
            <span className="chip-to">{toLabel}</span>
            <span className="chip-mode">{modeLabel}</span>
          </div>
        </div>

        {/* LEFT side: distance */}
        <div className="nav-side-panel left">
          <div className="nav-side-card">
            <strong>{formatDist(route.totalDistance)}</strong>
            <span>Distance</span>
          </div>
        </div>

        {/* RIGHT side: time + arrival */}
        <div className="nav-side-panel right">
          <div className="nav-side-card">
            <strong>{route.totalTime ?? "—"} min</strong>
            <span>Time</span>
          </div>
          <div className="nav-side-card subtle">
            <strong>{arrivalStr}</strong>
            <span>Arrival</span>
          </div>
        </div>

        {/* Recentre + heading indicator */}
        <button
          type="button"
          className="nav-recenter-fab"
          onClick={() => setFollowUser(true)}
          aria-label="Recentre on me"
          title="Recentre"
        >
          <Locate size={20} />
        </button>

        {nearDestination && (
          <button type="button" className="arrived-fab" onClick={completeNavigationArrived}>
            <Check size={18} /> I&apos;ve arrived
          </button>
        )}
      </div>
    );
  }

  const renderRatingModal = () => {
    if (!showRating) return null;
    const needsComplaint = ratingValue > 0 && ratingValue < 2;
    const canSubmit = ratingValue >= 2 || (ratingValue === 1 && (ratingComplaint || "").trim().length >= 5);
    return (
      <div className="rating-overlay">
        <div className="rating-sheet">
          <h3>How was your route?</h3>
          <p className="rating-sub">
            {ratingRouteInfo?.to
              ? `You arrived at ${ratingRouteInfo.to}. Rate this navigation.`
              : "Rate this navigation experience."}
          </p>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`rating-star ${ratingValue >= n ? "on" : ""}`}
                onClick={() => handleStarSelect(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <Star size={36} fill={ratingValue >= n ? UL_GOLD : "none"} />
              </button>
            ))}
          </div>
          {needsComplaint && (
            <div className="rating-complaint">
              <label>
                <MessageSquare size={14} /> Please tell us what went wrong
              </label>
              <textarea
                rows={3}
                placeholder="Describe the issue (required for 1-star ratings)…"
                value={ratingComplaint}
                onChange={(e) => setRatingComplaint(e.target.value)}
              />
            </div>
          )}
          {needsComplaint && (
            <button
              type="button"
              className="btn-primary full"
              disabled={!canSubmit}
              onClick={() => submitRating()}
            >
              Submit rating
            </button>
          )}
          {ratingValue > 0 && ratingValue < 2 && !(ratingComplaint || "").trim() && (
            <p className="rating-hint">A short complaint is required for ratings under 2 stars.</p>
          )}

        </div>
      </div>
    );
  };

  const saveEventEdit = () => {
    if (!editingEvent) return;
    if (!(editingEvent.title || "").trim() || !(editingEvent.date || "").trim()) return;
    setCampusEvents((prev) => {
      const exists = prev.some((e) => e.id === editingEvent.id);
      if (exists) return prev.map((e) => (e.id === editingEvent.id ? { ...editingEvent } : e));
      return [{ ...editingEvent }, ...prev];
    });
    setEditingEvent(null);
  };

  const deleteEvent = (id) => {
    setCampusEvents((prev) => prev.filter((e) => e.id !== id));
    if (editingEvent?.id === id) setEditingEvent(null);
  };

  // ========== ADMIN DASHBOARD ==========
  if (view === "admin" && userProfile?.role === "admin") {
    return (
      <div className="mobile-screen admin-screen">
        <header className="admin-topbar">
          <button type="button" className="admin-icon-btn" onClick={() => setView("map")} title="Back to map">
            <MapIcon size={20} />
          </button>
          <div className="admin-topbar-title">
            <LayoutDashboard size={18} />
            <span>Admin</span>
          </div>
          <button type="button" className="admin-icon-btn" onClick={handleLogout} title="Sign out">
            <LogOut size={18} />
          </button>
        </header>

        <div className="admin-hero">
          <div className="admin-hero-text">
            <span className="admin-hero-kicker">Control centre</span>
            <h2>Hello, {(userProfile.fullName || "Admin").split(" ")[0]}</h2>
            <p>Manage campus events, track usage, and review navigation feedback.</p>
          </div>
          <div className="admin-hero-avatar">
            {(userProfile.fullName || "A").charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="admin-tabs">
          <button type="button" className={adminTab === "overview" ? "active" : ""} onClick={() => setAdminTab("overview")}>
            <BarChart3 size={16} /> Overview
          </button>
          <button type="button" className={adminTab === "events" ? "active" : ""} onClick={() => setAdminTab("events")}>
            <Calendar size={16} /> Events
          </button>
          <button type="button" className={adminTab === "feedback" ? "active" : ""} onClick={() => setAdminTab("feedback")}>
            <MessageSquare size={16} /> Feedback
          </button>
        </div>

        <div className="admin-body">
          {adminTab === "overview" && (
            <>
              <div className="admin-stats-grid">
                <div className="admin-stat-card sessions">
                  <div className="admin-stat-icon"><Activity size={18} /></div>
                  <span className="admin-stat-label">App sessions</span>
                  <strong>{appStats.appSessions || 0}</strong>
                  <span className="admin-stat-hint">Times the app was opened</span>
                </div>
                <div className="admin-stat-card students">
                  <div className="admin-stat-icon"><Users size={18} /></div>
                  <span className="admin-stat-label">Student logins</span>
                  <strong>{(appStats.studentLogins || []).length}</strong>
                  <span className="admin-stat-hint">{uniqueStudentLogins} unique students</span>
                </div>
                <div className="admin-stat-card feedback">
                  <div className="admin-stat-icon"><Star size={18} /></div>
                  <span className="admin-stat-label">Feedback</span>
                  <strong>{userFeedback.length}</strong>
                  <span className="admin-stat-hint">{avgRating ? `Avg ${avgRating}★` : "No ratings yet"}</span>
                </div>
                <div className="admin-stat-card events">
                  <div className="admin-stat-icon"><Calendar size={18} /></div>
                  <span className="admin-stat-label">Events</span>
                  <strong>{campusEvents.length}</strong>
                  <span className="admin-stat-hint">On the public calendar</span>
                </div>
              </div>
              <div className="admin-section">
                <div className="admin-section-title">
                  <Users size={16} />
                  <h4>Recent student activity</h4>
                </div>
                {(appStats.studentLogins || []).length === 0 && (
                  <p className="muted admin-empty">No student logins recorded yet.</p>
                )}
                <ul className="admin-list">
                  {[...(appStats.studentLogins || [])].slice(-12).reverse().map((l, i) => (
                    <li key={`${l.id}-${l.at}-${i}`}>
                      <div className="admin-list-avatar">{(l.name || l.id || "?").charAt(0).toUpperCase()}</div>
                      <div className="admin-list-body">
                        <strong>{l.name || l.id}</strong>
                        <span>{l.id} · {l.type || "login"}</span>
                      </div>
                      <em>{l.at ? new Date(l.at).toLocaleString() : ""}</em>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {adminTab === "events" && (
            <>
              <div className="admin-section-header">
                <div className="admin-section-title">
                  <Calendar size={16} />
                  <h4>Manage events</h4>
                </div>
                <button
                  type="button"
                  className="btn-primary admin-add-btn"
                  onClick={() =>
                    setEditingEvent({
                      id: `ev-${Date.now()}`,
                      title: "",
                      date: "2026-09-15",
                      time: "09:00",
                      endTime: "10:00",
                      location: "",
                      placeId: "",
                      category: "student",
                      description: ""
                    })
                  }
                >
                  <Plus size={16} /> Add event
                </button>
              </div>

              {editingEvent && (
                <div className="admin-event-form">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      placeholder="Event title"
                    />
                  </div>
                  <div className="admin-form-row">
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={editingEvent.date}
                        onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Start</label>
                      <input
                        type="time"
                        value={editingEvent.time}
                        onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>End</label>
                      <input
                        type="time"
                        value={editingEvent.endTime || ""}
                        onChange={(e) => setEditingEvent({ ...editingEvent, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      value={editingEvent.location}
                      onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                      placeholder="Building or venue name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={editingEvent.category}
                      onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="academic">Academic</option>
                      <option value="recreation">Recreation</option>
                      <option value="support">Support</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows={2}
                      value={editingEvent.description}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    />
                  </div>
                  <div className="profile-actions modern">
                    <button type="button" className="btn-primary" onClick={saveEventEdit}>
                      <Save size={16} /> Save event
                    </button>
                    <button type="button" className="text-btn" onClick={() => setEditingEvent(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <ul className="admin-list events-admin-list">
                {campusEvents
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((ev) => (
                    <li key={ev.id}>
                      <div>
                        <strong>{ev.title}</strong>
                        <span>
                          {ev.date} · {ev.time}
                          {ev.endTime ? `–${ev.endTime}` : ""} · {ev.location}
                        </span>
                      </div>
                      <div className="admin-list-actions">
                        <button type="button" className="text-btn" onClick={() => setEditingEvent({ ...ev })}>
                          Edit
                        </button>
                        <button type="button" className="text-btn danger" onClick={() => deleteEvent(ev.id)}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </>
          )}

          {adminTab === "feedback" && (
            <>
              <div className="admin-section">
                <div className="admin-section-title">
                  <MessageSquare size={16} />
                  <h4>Ratings & complaints</h4>
                </div>
                {userFeedback.length === 0 && <p className="muted admin-empty">No feedback submitted yet.</p>}
                <ul className="admin-list feedback-list">
                  {userFeedback.map((f) => (
                    <li key={f.id} className={`feedback-item ${f.rating < 2 ? "low" : ""}`}>
                      <div className="feedback-head">
                        <strong className="feedback-stars">
                          {"★".repeat(f.rating)}
                          <span className="dim">{"★".repeat(Math.max(0, 5 - f.rating))}</span>
                        </strong>
                        <em>{f.at ? new Date(f.at).toLocaleString() : ""}</em>
                      </div>
                      <span className="feedback-meta">
                        {f.userName} ({f.userId}) · {f.routeFrom || "?"} → {f.routeTo || "?"}
                      </span>
                      {f.complaint && (
                        <p className="feedback-complaint">
                          <MessageSquare size={14} /> {f.complaint}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
        {renderRatingModal()}
      </div>
    );
  }

  const renderBottomNav = (active) => (
    <nav className="bottom-nav">
      <button type="button" className={`nav-item nav-map ${active === "map" ? "active" : ""}`} onClick={() => setView("map")}>
        <span className="nav-icon-wrap"><MapIcon size={22} strokeWidth={2.35} /></span>
        <span>Map</span>
      </button>
      <button type="button" className={`nav-item nav-find ${active === "search" ? "active" : ""}`} onClick={() => setView("search")}>
        <span className="nav-icon-wrap"><Search size={22} strokeWidth={2.35} /></span>
        <span>Find</span>
      </button>
      <button type="button" className={`nav-item nav-events ${active === "events" ? "active" : ""}`} onClick={() => setView("events")}>
        <span className="nav-icon-wrap"><Calendar size={22} strokeWidth={2.35} /></span>
        <span>Events</span>
      </button>
      <button type="button" className={`nav-item nav-routes ${active === "route" ? "active" : ""}`} onClick={() => setView("route")}>
        <span className="nav-icon-wrap"><Route size={22} strokeWidth={2.35} /></span>
        <span>Routes</span>
      </button>
      <button type="button" className={`nav-item nav-profile ${active === "profile" ? "active" : ""}`} onClick={() => setView("profile")}>
        <span className="nav-icon-wrap"><User size={22} strokeWidth={2.35} /></span>
        <span>Profile</span>
      </button>
    </nav>
  );

  // ========== SEARCH ==========
  if (isMobile && view === "search") {
    return (
      <div className="mobile-screen">
        <header className="mobile-header ul-header">
          <div className="logo-area">
            <img src="/ul-logo.jpeg" alt="University of Limpopo" className="ul-logo-img" />
            <span>University of Limpopo</span>
          </div>
        </header>
        {renderSearchPanel()}
        {renderBottomNav("search")}
        {renderSettingsModal()}
        {renderModeBeforeNavModal()}
      </div>
    );
  }

  // ========== EVENTS (mobile) ==========
  if (isMobile && view === "events") {
    return (
      <div className="mobile-screen">
        <header className="mobile-header ul-header">
          <div className="logo-area">
            <img src="/ul-logo.jpeg" alt="University of Limpopo" className="ul-logo-img" />
            <span>University of Limpopo</span>
          </div>
        </header>
        {renderEventsPanel()}
        {renderBottomNav("events")}
        {renderSettingsModal()}
        {renderModeBeforeNavModal()}
      </div>
    );
  }

  // ========== FAVOURITES (mobile) ==========
  if (isMobile && view === "favourites") {
    return (
      <div className="mobile-screen">
        <header className="mobile-header ul-header">
          <button className="icon-btn" onClick={() => setView("map")}><Menu size={22} /></button>
          <div className="logo-area">
            <img src="/ul-logo.jpeg" alt="University of Limpopo" className="ul-logo-img" />
            <span>Favourites</span>
          </div>
        </header>
        {renderFavouritesPanel()}
        {renderBottomNav("map")}
        {renderSettingsModal()}
        {renderModeBeforeNavModal()}
      </div>
    );
  }

  // ========== PROFILE (mobile) ==========
  if (isMobile && view === "profile") {
    return (
      <div className="mobile-screen">
        <header className="mobile-header ul-header">
          <div className="logo-area">
            <img src="/ul-logo.jpeg" alt="University of Limpopo" className="ul-logo-img" />
            <span>University of Limpopo</span>
          </div>
        </header>
        {renderProfilePanel()}
        {renderBottomNav("profile")}
        {renderSettingsModal()}
        {renderModeBeforeNavModal()}
      </div>
    );
  }

  // ========== ROUTE PLANNER (place → place, no GPS required) ==========
  if (view === "route") {
    const fromLabel =
      useLiveAsFrom && userPos
        ? "Your live location"
        : fromPlace
          ? fromPlace.name
          : null;
    const toLabel = toPlace ? toPlace.name : null;
    const canSwap = !!(fromPlace || (useLiveAsFrom && userPos)) && !!toPlace;

    return (
      <div className="mobile-screen route-planner-screen">
        <header className="mobile-header ul-header">
          <div className="logo-area">
            <img src="/ul-logo.jpeg" alt="University of Limpopo" className="ul-logo-img" />
            <span>University of Limpopo</span>
          </div>
        </header>

        <div className="route-planner">
          <div className="planner-hero">
            <div className="planner-hero-icon">
              <Route size={28} strokeWidth={2} />
            </div>
            <div>
              <h2 className="planner-hero-title">Where to?</h2>
            </div>
          </div>

          <div className="planner-card">
            <div className="planner-timeline">
              <div className="planner-node from">
                <span className="planner-node-dot blue" />
                <span className="planner-node-line" />
              </div>
              <div className="planner-node to">
                <span className="planner-node-dot gold" />
              </div>
            </div>

            <div className="planner-fields">
              <div className="planner-field-block">
                <div className="planner-field-label">
                  <Locate size={14} /> From
                </div>
                <button
                  type="button"
                  className={`planner-pick ${fromLabel ? "filled" : "empty"}`}
                  onClick={() => {
                    setPicking("from");
                    setView("search");
                  }}
                >
                  <span className="planner-pick-text">
                    {fromLabel || "Choose start place"}
                  </span>
                  <ChevronRight size={18} className="planner-pick-chevron" />
                </button>
                {userPos && (
                  <button type="button" className="planner-live-btn" onClick={useMyLocationAsFrom}>
                    <Locate size={14} />
                    Use my live location
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`swap-btn modern ${canSwap ? "" : "disabled"}`}
                onClick={swapFromTo}
                title="Swap from and to"
                disabled={!canSwap}
              >
                <ArrowUpDown size={18} />
              </button>

              <div className="planner-field-block">
                <div className="planner-field-label">
                  <MapPin size={14} /> To
                </div>
                <button
                  type="button"
                  className={`planner-pick ${toLabel ? "filled" : "empty"}`}
                  onClick={() => {
                    setPicking("to");
                    setView("search");
                  }}
                >
                  <span className="planner-pick-text">
                    {toLabel || "Choose destination"}
                  </span>
                  <ChevronRight size={18} className="planner-pick-chevron" />
                </button>
              </div>
            </div>
          </div>

          {routing && (
            <div className="routing-msg modern">
              <div className="routing-spinner" />
              Calculating your route…
            </div>
          )}

          {route && !routing && (
            <div className="planner-result modern">
              <div className="planner-stats">
                <div className="planner-stat">
                  <strong>{route.totalTime}</strong>
                  <span>{route.travelMode === "driving" ? "min drive" : "min walk"}</span>
                </div>
                <div className="planner-stat-divider" />
                <div className="planner-stat">
                  <strong>
                    {route.totalDistance >= 1000
                      ? (route.totalDistance / 1000).toFixed(1)
                      : route.totalDistance}
                  </strong>
                  <span>{route.totalDistance >= 1000 ? "km" : "m"} {route.travelMode === "driving" ? "by road" : "on path"}</span>
                </div>
                <div className="planner-stat-divider" />
                <div className="planner-stat">
                  <strong>
                    {new Date(Date.now() + (route.totalTime || 0) * 60000).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </strong>
                  <span>arrival</span>
                </div>
              </div>
              <button
                type="button"
                className="start-nav-btn planner-cta"
                onClick={() => {
                  setShowRoutePanel(true);
                  setView("map");
                  startNavigation();
                }}
              >
                <Navigation size={18} /> Start navigation
              </button>
              <button
                type="button"
                className="planner-secondary-btn"
                onClick={() => {
                  setShowRoutePanel(true);
                  setView("map");
                }}
              >
                <MapIcon size={16} /> Show on map
              </button>
            </div>
          )}

          </div>
        {renderBottomNav("route")}
        {renderSettingsModal()}
        {renderModeBeforeNavModal()}
      </div>
    );
  }

  // ========== MAIN MAP ==========
  return (
    <div className={`app-layout ${isMobile ? "mobile" : "desktop"}`}>
      {!isMobile && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <img src="/ul-logo.jpeg" alt="University of Limpopo" className="ul-logo-img lg" />
            <div>
              <div className="uni-name">University of</div>
              <div className="uni-name bold">LIMPOPO</div>
              <div className="tagline">Finding solutions for Africa</div>
            </div>
          </div>
          <nav className="side-nav">
            <button className={`side-item ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>
              <Home size={18} /> Campus Map
            </button>
            <button className={`side-item ${view === "search" ? "active" : ""}`} onClick={() => setView("search")}>
              <Search size={18} /> Find Places
            </button>
            <button className={`side-item ${view === "events" ? "active" : ""}`} onClick={() => setView("events")}>
              <Calendar size={18} /> Events
            </button>
            <button className={`side-item ${view === "route" ? "active" : ""}`} onClick={() => setView("route")}>
              <Route size={18} /> Plan route
            </button>
            <button className={`side-item ${view === "favourites" ? "active" : ""}`} onClick={() => setView("favourites")}>
              <Star size={18} /> Favourites
              {favourites.length > 0 && <span className="side-badge">{favourites.length}</span>}
            </button>
            <button className={`side-item ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}>
              <User size={18} /> Profile
            </button>
          </nav>
          <div className="side-section">Categories</div>
          <div className="cat-list">
            {CATEGORIES.map((c) => {
              const Icon = c.Icon;
              const isActive = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`cat-item ${isActive ? "active" : ""}`}
                  onClick={() => setActiveCategory(isActive && c.id !== "all" ? "all" : c.id)}
                  style={isActive ? { "--cat-accent": c.color } : undefined}
                >
                  <span className="cat-icon-wrap" style={{ background: `${c.color}22`, color: c.color }}>
                    <Icon size={16} strokeWidth={2.25} />
                  </span>
                  <span className="cat-item-label">{c.name}</span>
                  {isActive && <span className="cat-item-check" style={{ background: c.color }} />}
                </button>
              );
            })}
          </div>
          <div className="access-panel">
            <Accessibility size={20} />
            <div>
              <strong>Accessibility On</strong>
              <div className="sub">
                {travelMode === "driving"
                  ? "Applies to walking mode (pathways)"
                  : "Campus pathways prefer accessible"}
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={accessibilityOn} onChange={() => setAccessibilityOn(!accessibilityOn)} />
              <span className="slider" />
            </label>
          </div>
        </aside>
      )}

      <main className="main-content">
        <header className="top-bar">
          {isMobile && (
            <img src="/ul-logo.jpeg" alt="University of Limpopo" className="ul-logo-img" />
          )}
          <div className="search-bar" onClick={() => isMobile && setView("search")}>
            <Search size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => isMobile && setView("search")}
              placeholder="Search buildings, places and services..."
            />
          </div>
          {!isMobile && (
            <div className="top-actions">
              <button className="btn-outline" onClick={() => setView("search")}><Search size={16} /> Find Places</button>
              <button className="btn-outline" onClick={() => setView("events")}><Calendar size={16} /> Events</button>
              <button className="btn-outline" onClick={() => setView("route")}><Route size={16} /> Plan route</button>
            </div>
          )}
        </header>

        {isMobile && (
          <div className="cat-chips">
            {CATEGORIES.map((c) => {
              const Icon = c.Icon;
              const isActive = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${isActive ? "active" : ""}`}
                  onClick={() => setActiveCategory(c.id)}
                  style={isActive ? { background: `${c.color}18`, borderColor: c.color, color: c.color } : undefined}
                >
                  <Icon size={14} strokeWidth={2.25} />
                  {c.name}
                </button>
              );
            })}
          </div>
        )}

        {geoError && (
          <div className="geo-banner">
            Live location: {geoError}. You can still plan place → place routes without GPS.
          </div>
        )}
        {routing && <div className="geo-banner">Calculating route…</div>}

        <div className="map-wrapper">
          {!isMobile && view === "search" && (
            <div className="desktop-search-overlay">
              {renderSearchPanel(true)}
            </div>
          )}
          {!isMobile && view === "favourites" && (
            <div className="desktop-search-overlay">
              {renderFavouritesPanel(true)}
            </div>
          )}
          {!isMobile && view === "profile" && (
            <div className="desktop-search-overlay">
              {renderProfilePanel(true)}
            </div>
          )}
          {!isMobile && view === "events" && (
            <div className="desktop-search-overlay">
              {renderEventsPanel(true)}
            </div>
          )}

          <MapContainer center={CAMPUS_CENTER} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={!isMobile} minZoom={11} maxZoom={19}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {boundaryGeo && (
              <GeoJSON data={boundaryGeo} style={{ color: UL_NAVY, weight: 2, fillOpacity: 0.04, dashArray: "6 4" }} />
            )}
            {buildingsGeo && (
              <GeoJSON
                data={buildingsGeo}
                style={buildingStyle}
                onEachFeature={(feature, layer) => {
                  const name = feature.properties?.OtherName || feature.properties?.Name || "Building";
                  const type = feature.properties?.Type || "";
                  // Hover: show building name
                  layer.bindTooltip(name, {
                    sticky: true,
                    direction: "top",
                    opacity: 0.95,
                    className: "building-hover-tooltip"
                  });
                  // Click: full popup
                  layer.bindPopup(`<strong>${name}</strong>${type ? `<br/>${type}` : ""}`);
                  layer.on({
                    mouseover: (e) => {
                      const target = e.target;
                      target.setStyle({
                        weight: 2.5,
                        color: UL_GOLD,
                        fillOpacity: 0.7
                      });
                      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                        target.bringToFront();
                      }
                    },
                    mouseout: (e) => {
                      e.target.setStyle(buildingStyle(feature));
                    }
                  });
                }}
              />
            )}
            {/* Only the active route in blue */}
            {route?.coords?.length > 1 && (
              <Polyline positions={route.coords} color={ROUTE_BLUE} weight={5} opacity={0.95} />
            )}
            {filteredPlaces.map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={createPlaceIcon(p, selectedPlace?.id === p.id || toPlace?.id === p.id || fromPlace?.id === p.id)}
                eventHandlers={{ click: () => handleSelectPlace(p) }}
              >
                <Popup>
                  <strong>{p.name}</strong>
                  <br />
                  <span style={{ color: CATEGORY_COLORS[placeCategory(p)] || UL_NAVY, fontWeight: 600 }}>
                    {placeCategory(p) === "parking" ? "P · Parking" : placeCategory(p)}
                  </span>
                  <br />
                  <div className="popup-actions">
                    <button className="popup-btn" onClick={() => handleSelectPlace(p)}>Navigate here</button>
                    <button
                      className={`popup-fav ${isFavourite(p.id) ? "active" : ""}`}
                      onClick={() => toggleFavourite(p.id)}
                      title={isFavourite(p.id) ? "Remove favourite" : "Add favourite"}
                    >
                      <Star size={14} fill={isFavourite(p.id) ? UL_GOLD : "none"} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            {userPos && (
              <Marker position={userPos} icon={createYouAreHereIcon(userHeading)}>
                <Popup>You are here (live)</Popup>
              </Marker>
            )}
            {userPos && (
              <CircleMarker center={userPos} radius={5} pathOptions={{ color: UL_NAVY, fillColor: UL_GOLD, fillOpacity: 0.25 }} />
            )}
            <RecenterMap center={userPos || CAMPUS_CENTER} zoom={15} once />
            <LiveLocationController position={userPos} follow={followUser && isNavigating} />
          </MapContainer>

          <div className="floating-controls">
            <button title="My location" onClick={() => { setFollowUser(true); useMyLocationAsFrom(); }}>
              <Locate size={18} />
            </button>
          </div>
        </div>

        {showRoutePanel && route && !isNavigating && (
          <div className={`route-panel ${isMobile ? "bottom" : "side"}`}>
            <div className="route-header">
              <div className="route-from-to">
                <div className="ft-row">
                  <span className="dot blue" />
                  <span className="label">FROM</span>
                  <strong>{route.from?.name}</strong>
                </div>
                <div className="ft-row">
                  <span className="dot gold" />
                  <span className="label">TO</span>
                  <strong>{route.to.name}</strong>
                </div>
              </div>
              <div className="route-meta">
                <div className="time">{route.totalTime} min</div>
                <div className="dist">{route.totalDistance} m</div>
              </div>
            </div>
            <div className="route-options">
              <label className="option active">
                <input type="radio" checked readOnly />
                {route.travelMode === "driving" ? <Car size={16} /> : <Footprints size={16} />}
                {route.travelMode === "driving"
                  ? route.mode === "campus"
                    ? "Campus roads (driving)"
                    : "Driving (real roads)"
                  : route.mode === "campus"
                    ? "Campus pathways (walking)"
                    : route.mode === "outside"
                      ? "Walking (real roads)"
                      : "Route"}
                <span className="meta">{route.totalTime} min · {route.totalDistance} m</span>
              </label>
            </div>
            {route.steps?.length > 0 && (
              <div className="steps-list">
                <div className="steps-title">Route steps</div>
                {route.steps.map((s, i) => (
                  <div key={i} className="step-item">
                    <div className="step-num">{i + 1}</div>
                    <div className="step-body">
                      <div className="step-instruction">{s.instruction}</div>
                      {s.distance > 0 && <div className="step-dist">{s.distance} m</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="start-nav-btn" onClick={startNavigation} disabled={routing}>
              <Navigation size={18} /> Start Navigation
            </button>
            <button
              type="button"
              className="btn-outline full clear-route-btn"
              onClick={() => {
                setShowRoutePanel(false);
                setRoute(null);
                setSelectedPlace(null);
                setFromPlace(null);
                setToPlace(null);
              }}
            >
              Clear route
            </button>
          </div>
        )}

        {isMobile && renderBottomNav("map")}

        {renderSettingsModal()}
        {renderModeBeforeNavModal()}
        {renderRatingModal()}
      </main>
    </div>
  );
}

export default App;
