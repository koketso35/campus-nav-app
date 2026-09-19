import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  MessageSquare,
  Users,
  Star,
  Activity,
  LogOut,
  Plus,
  Save,
  Trash2,
  MapPin,
  Clock,
  RefreshCw,
  Search,
  AlertTriangle,
  TrendingUp,
  Layers,
  Edit3,
  CheckCircle2,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  X,
  Navigation,
} from "lucide-react";
import { api } from "./api/client";
import ConfirmDialog from "./components/ConfirmDialog";
import Toast from "./components/Toast";
import { formatDate, formatDateTime, formatRelative } from "./utils/format";

export default function AdminDashboard({ userProfile, onLogout }) {
  const [adminTab, setAdminTab] = useState("overview");

  // ─── Overview data ───
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [popularPlaces, setPopularPlaces] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);

  // ─── Events ───
  const [campusEvents, setCampusEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventFilter, setEventFilter] = useState("all");

  // ─── Feedback ───
  const [feedback, setFeedback] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState("all");

  // ─── Users ───
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [editingUserEmail, setEditingUserEmail] = useState(null);

  // ─── Places ───
  const [adminPlaces, setAdminPlaces] = useState([]);
  const [placeSearch, setPlaceSearch] = useState("");
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState("all");
  const [placePagination, setPlacePagination] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);

  // ─── Analytics tab ───
  const [analyticsPlaces, setAnalyticsPlaces] = useState([]);
  const [analyticsRoutes, setAnalyticsRoutes] = useState([]);
  const [analyticsPlaceSearch, setAnalyticsPlaceSearch] = useState("");
  const [analyticsRouteSearch, setAnalyticsRouteSearch] = useState("");

  // ─── Activity pagination + search ───
  const [activityPage, setActivityPage] = useState(1);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityPagination, setActivityPagination] = useState(null);

  // ─── Loading / errors / toasts ───
  const [loading, setLoading] = useState({
    stats: false,
    activity: false,
    feedback: false,
    users: false,
    events: false,
    places: false,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [toasts, setToasts] = useState([]);

  // ─── Confirm dialog ───
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    variant: "danger",
    onConfirm: null,
  });

  const openConfirm = useCallback((opts) => {
    setConfirmState({ open: true, ...opts });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState((s) => ({ ...s, open: false }));
  }, []);

  const pushToast = useCallback((message, variant = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setLoad = (key, value) =>
    setLoading((s) => ({ ...s, [key]: value }));

  // ─────────────────────────────────────────────
  // LOADERS (all useCallback to avoid lint warnings)
  // ─────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoad("stats", true);
    try {
      const [statsRes, placesRes, routesRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminPopularPlaces({ limit: 5 }),
        api.getAdminPopularRoutes({ limit: 5 }),
      ]);
      setStats(statsRes.data);
      setPopularPlaces(placesRes.data || []);
      setPopularRoutes(routesRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load stats");
    } finally {
      setLoad("stats", false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setLoad("events", true);
    try {
      const res = await api.getEvents({ limit: 200 });
      setCampusEvents(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load events");
    } finally {
      setLoad("events", false);
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    setLoad("feedback", true);
    try {
      const params = { limit: 200 };
      if (feedbackFilter === "low") params.lowOnly = true;
      if (feedbackFilter === "open") params.status = "open";
      if (feedbackFilter === "reviewed") params.status = "reviewed";
      const res = await api.getAdminFeedback(params);
      setFeedback(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load feedback");
    } finally {
      setLoad("feedback", false);
    }
  }, [feedbackFilter]);

  const loadUsers = useCallback(async () => {
    setLoad("users", true);
    try {
      const params = { limit: 200 };
      if (userRoleFilter !== "all") params.role = userRoleFilter;
      if (userSearch.trim()) params.search = userSearch.trim();
      const res = await api.getAdminUsers(params);
      setUsers(res.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load users");
    } finally {
      setLoad("users", false);
    }
  }, [userRoleFilter, userSearch]);

  const loadPlaces = useCallback(async () => {
    setLoad("places", true);
    try {
      const params = { page: 1, limit: 300 };
      if (placeSearch.trim()) params.search = placeSearch.trim();
      if (placeCategoryFilter !== "all") params.category = placeCategoryFilter;
      const res = await api.getAdminPlaces(params);
      setAdminPlaces(res.data || []);
      setPlacePagination(res.pagination || null);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load places");
    } finally {
      setLoad("places", false);
    }
  }, [placeSearch, placeCategoryFilter]);

  const loadAnalytics = useCallback(async () => {
    setLoad("stats", true);
    try {
      const [placesRes, routesRes] = await Promise.all([
        api.getAdminPopularPlaces({ limit: 50 }),
        api.getAdminPopularRoutes({ limit: 50 }),
      ]);
      setAnalyticsPlaces(placesRes.data || []);
      setAnalyticsRoutes(routesRes.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load analytics");
    } finally {
      setLoad("stats", false);
    }
  }, []);

  const loadActivityWithPagination = useCallback(async () => {
    setLoad("activity", true);
    try {
      const params = { page: activityPage, limit: 15 };
      if (activitySearch.trim()) params.search = activitySearch.trim();
      const res = await api.getAdminActivity(params);
      setActivity(res.data || []);
      setActivityPagination(res.pagination || null);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load activity");
    } finally {
      setLoad("activity", false);
    }
  }, [activityPage, activitySearch]);

  // ─────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStats();
      loadEvents();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadStats, loadEvents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (adminTab === "overview") loadActivityWithPagination();
      if (adminTab === "feedback") loadFeedback();
      if (adminTab === "users") loadUsers();
      if (adminTab === "analytics") loadAnalytics();
      if (adminTab === "places") loadPlaces();
      if (adminTab === "events") loadEvents();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    adminTab,
    loadActivityWithPagination,
    loadFeedback,
    loadUsers,
    loadAnalytics,
    loadPlaces,
    loadEvents,
  ]);

  useEffect(() => {
    if (adminTab !== "overview") return;
    const t = setTimeout(() => setActivityPage(1), 300);
    return () => clearTimeout(t);
  }, [activitySearch, adminTab]);

  useEffect(() => {
    if (adminTab !== "places") return;
    const t = setTimeout(loadPlaces, 300);
    return () => clearTimeout(t);
  }, [placeSearch, placeCategoryFilter, adminTab, loadPlaces]);

  useEffect(() => {
    if (adminTab !== "users") return;
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [userSearch, adminTab, loadUsers]);

  // ─────────────────────────────────────────────
  // EVENT CRUD
  // ─────────────────────────────────────────────
  const startNewEvent = () => {
    setEditingEvent({
      id: `ev-${Date.now()}`,
      title: "",
      date: new Date().toISOString().slice(0, 10),
      time: "09:00",
      endTime: "10:00",
      location: "",
      category: "student",
      description: "",
    });
  };

  const saveEventEdit = async () => {
    if (!editingEvent) return;
    if (!editingEvent.title?.trim() || !editingEvent.date) {
      pushToast("Title and date are required", "error");
      return;
    }

    const payload = {
      title: editingEvent.title.trim(),
      description: editingEvent.description || null,
      category: editingEvent.category || "student",
      date: editingEvent.date,
      time: editingEvent.time || "09:00",
      endTime: editingEvent.endTime || null,
      location: editingEvent.location || null,
    };

    const isNew = String(editingEvent.id || "").startsWith("ev-");

    try {
      const res = isNew
        ? await api.createEvent(payload)
        : await api.updateEvent(editingEvent.id, payload);
      const saved = res.data;
      setCampusEvents((prev) => {
        const exists = prev.some((e) => e.id === saved.id);
        return exists
          ? prev.map((e) => (e.id === saved.id ? saved : e))
          : [...prev, saved];
      });
      setEditingEvent(null);
      pushToast(isNew ? "Event created" : "Event updated");
    } catch (err) {
      const msg = err.message || "Could not save event";
      setErrorMsg(msg);
      pushToast(msg, "error");
    }
  };

  const deleteEvent = (id) => {
    const ev = campusEvents.find((e) => e.id === id);
    openConfirm({
      title: "Delete event?",
      message: `"${ev?.title || "This event"}" will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete event",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.deleteEvent(id);
          setCampusEvents((prev) => prev.filter((e) => e.id !== id));
          if (editingEvent?.id === id) setEditingEvent(null);
          pushToast("Event deleted");
        } catch (err) {
          const msg = err.message || "Could not delete event";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  const deleteAllPastEvents = () => {
    openConfirm({
      title: "Delete past events?",
      message:
        "All events with a date before today will be permanently removed. This cannot be undone.",
      confirmLabel: "Delete past events",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.deleteAdminEventsByFilter({ scope: "past" });
          loadEvents();
          pushToast("Past events deleted");
        } catch (err) {
          const msg = err.message || "Could not delete events";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  // ─────────────────────────────────────────────
  // FEEDBACK ACTIONS
  // ─────────────────────────────────────────────
  const markFeedbackReviewed = (id) => {
    openConfirm({
      title: "Mark as reviewed?",
      message: "This feedback will be flagged as reviewed.",
      confirmLabel: "Mark reviewed",
      variant: "default",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.updateAdminFeedback(id, { status: "reviewed" });
          setFeedback((prev) =>
            prev.map((f) => (f.id === id ? { ...f, status: "reviewed" } : f))
          );
          pushToast("Feedback marked reviewed");
        } catch (err) {
          const msg = err.message || "Could not update feedback";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  const saveFeedbackNotes = (id, current) => {
    const notes = window.prompt("Admin notes:", current || "");
    if (notes === null) return;
    openConfirm({
      title: "Save note?",
      message: "This note will be attached to the feedback for future reference.",
      confirmLabel: "Save note",
      variant: "default",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.updateAdminFeedback(id, { adminNotes: notes });
          setFeedback((prev) =>
            prev.map((f) => (f.id === id ? { ...f, adminNotes: notes } : f))
          );
          pushToast("Note saved");
        } catch (err) {
          const msg = err.message || "Could not save note";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  const deleteFeedback = (id) => {
    openConfirm({
      title: "Delete feedback?",
      message: "This rating and any complaint will be permanently removed.",
      confirmLabel: "Delete feedback",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.deleteAdminFeedback(id);
          setFeedback((prev) => prev.filter((f) => f.id !== id));
          pushToast("Feedback deleted");
        } catch (err) {
          const msg = err.message || "Could not delete feedback";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  const deleteAllFeedback = () => {
    const filterLabel =
      feedbackFilter === "all"
        ? "all open feedback (safe default)"
        : feedbackFilter === "low"
          ? "all low-rating feedback (≤2 stars)"
          : feedbackFilter === "open"
            ? "all not-yet-reviewed feedback"
            : "all already-reviewed feedback";

    openConfirm({
      title: "Delete all matching feedback?",
      message: `This will permanently remove ${filterLabel}. This cannot be undone.`,
      confirmLabel: "Delete matching",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          const params = {};
          if (feedbackFilter === "low") params.lowOnly = true;
          else if (feedbackFilter === "open") params.status = "open";
          else if (feedbackFilter === "reviewed") params.status = "reviewed";
          else params.status = "open";

          await api.deleteAllAdminFeedback(params);
          loadFeedback();
          pushToast("Matching feedback deleted");
        } catch (err) {
          const msg = err.message || "Could not delete feedback";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  // ─────────────────────────────────────────────
  // USER ACTIONS
  // ─────────────────────────────────────────────
  const saveUserEmail = () => {
    if (!editingUserEmail) return;
    const { id, email } = editingUserEmail;
    const trimmed = (email || "").trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      pushToast("Enter a valid email address", "error");
      return;
    }
    const u = users.find((x) => x.id === id);
    openConfirm({
      title: "Change email?",
      message: `${u?.fullName || "This user"}'s email will be changed to ${trimmed}.`,
      confirmLabel: "Update email",
      variant: "default",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.updateAdminUserEmail(id, trimmed);
          setUsers((prev) =>
            prev.map((x) => (x.id === id ? { ...x, email: trimmed } : x))
          );
          setEditingUserEmail(null);
          pushToast("Email updated");
        } catch (err) {
          const msg = err.message || "Could not update email";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  const deleteUser = (userId) => {
    const u = users.find((x) => x.id === userId);
    openConfirm({
      title: "Delete user?",
      message: `${u?.fullName || "This user"} (${u?.studentNumber || "?"}) will lose access. Their ratings and routes will be preserved for analytics.`,
      confirmLabel: "Delete user",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.deleteAdminUser(userId);
          setUsers((prev) => prev.filter((x) => x.id !== userId));
          pushToast("User deleted");
        } catch (err) {
          const msg = err.message || "Could not delete user";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  // ─────────────────────────────────────────────
  // PLACE ACTIONS
  // ─────────────────────────────────────────────
  const startNewPlace = () => {
    setEditingPlace({
      id: null,
      slug: "",
      name: "",
      code: "",
      category: "academic",
      latitude: "",
      longitude: "",
      is_active: true,
    });
  };

  const togglePlace = (place) => {
    const deactivating = place.is_active;
    openConfirm({
      title: deactivating ? "Hide this place?" : "Show this place?",
      message: deactivating
        ? `"${place.name}" will be hidden from the student map. You can re-activate it any time.`
        : `"${place.name}" will appear on the student map again.`,
      confirmLabel: deactivating ? "Hide place" : "Activate place",
      variant: deactivating ? "danger" : "default",
      onConfirm: async () => {
        closeConfirm();
        try {
          const res = await api.toggleAdminPlaceActive(place.id);
          setAdminPlaces((prev) =>
            prev.map((p) =>
              p.id === place.id ? { ...p, is_active: res.data.is_active } : p
            )
          );
          pushToast(res.data.is_active ? "Place activated" : "Place hidden");
        } catch (err) {
          const msg = err.message || "Could not toggle place";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  const savePlaceEdit = () => {
    if (!editingPlace) return;
    const isNew = !editingPlace.id;

    if (!editingPlace.name?.trim()) {
      pushToast("Name is required", "error");
      return;
    }
    const lat = parseFloat(editingPlace.latitude);
    const lng = parseFloat(editingPlace.longitude);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      pushToast("Valid latitude is required (-90 to 90)", "error");
      return;
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      pushToast("Valid longitude is required (-180 to 180)", "error");
      return;
    }

    const payload = {
      slug: editingPlace.slug?.trim() || editingPlace.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      name: editingPlace.name.trim(),
      code: editingPlace.code?.trim() || null,
      category: editingPlace.category,
      type: editingPlace.category,
      latitude: lat,
      longitude: lng,
      is_active: editingPlace.is_active ?? true,
    };

    openConfirm({
      title: isNew ? "Add this place?" : "Save changes?",
      message: isNew
        ? `"${payload.name}" will be added to the campus map.`
        : `Updates to "${payload.name}" will be saved.`,
      confirmLabel: isNew ? "Add place" : "Save changes",
      variant: "default",
      onConfirm: async () => {
        closeConfirm();
        try {
          if (isNew) {
            await api.createAdminPlace(payload);
            pushToast("Place added");
          } else {
            await api.updateAdminPlace(editingPlace.id, payload);
            pushToast("Place updated");
          }
          setEditingPlace(null);
          loadPlaces();
        } catch (err) {
          const msg = err.message || "Could not save place";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  const deletePlace = (place) => {
    openConfirm({
      title: "Delete this place?",
      message: `"${place.name}" will be permanently removed from the database. Favourites and route history that reference it may be affected.`,
      confirmLabel: "Delete place",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.deleteAdminPlace(place.id);
          setAdminPlaces((prev) => prev.filter((p) => p.id !== place.id));
          pushToast("Place deleted");
        } catch (err) {
          const msg = err.message || "Could not delete place";
          setErrorMsg(msg);
          pushToast(msg, "error");
        }
      },
    });
  };

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  const initials = (userProfile.fullName || "Admin")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const userRoleLabel = (role) => {
    if (role === "admin") return "Admin";
    if (role === "guest") return "Guest";
    return "Student";
  };

  const filteredEvents = campusEvents
    .slice()
    .filter((ev) => {
      const today = new Date().toISOString().slice(0, 10);
      if (eventFilter === "upcoming") return ev.date >= today;
      if (eventFilter === "past") return ev.date < today;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="admin-screen">
      <header className="admin-topbar">
        <div className="admin-topbar-title">
          <LayoutDashboard size={18} />
          <span>Admin Console</span>
        </div>
        <button
          type="button"
          className="admin-icon-btn"
          onClick={onLogout}
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </header>

      <div className="admin-hero">
        <div className="admin-hero-text">
          <span className="admin-hero-kicker">Control centre</span>
          <h2>Hello, {(userProfile.fullName || "Admin").split(" ")[0]}</h2>
          <p>Manage events, monitor usage, and review feedback.</p>
        </div>
        <div className="admin-hero-avatar">{initials}</div>
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
        <button type="button" className={adminTab === "users" ? "active" : ""} onClick={() => setAdminTab("users")}>
          <Users size={16} /> Users
        </button>
        <button type="button" className={adminTab === "analytics" ? "active" : ""} onClick={() => setAdminTab("analytics")}>
          <TrendingUp size={16} /> Analytics
        </button>
        <button type="button" className={adminTab === "places" ? "active" : ""} onClick={() => setAdminTab("places")}>
          <Layers size={16} /> Places
        </button>
      </div>

      <div className="admin-body">
        {errorMsg && (
          <div className="admin-login-msg">
            <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
            {errorMsg}
            <button className="admin-btn-text" onClick={() => setErrorMsg("")} style={{ marginLeft: 8 }}>
              Dismiss
            </button>
          </div>
        )}

        {/* ═══════════ OVERVIEW ═══════════ */}
        {adminTab === "overview" && (
          <>
            <div className="admin-section-header">
              <h4>Live snapshot</h4>
              <button type="button" className="admin-btn-text" onClick={loadStats}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card students">
                <div className="admin-stat-icon"><Users size={18} /></div>
                <span className="admin-stat-label">Total users</span>
                <strong>{loading.stats ? "…" : stats?.users?.total ?? 0}</strong>
                <span className="admin-stat-hint">
                  {stats?.users?.students ?? 0} students · {stats?.users?.guests ?? 0} guests · {stats?.users?.admins ?? 0} admin
                </span>
              </div>

              <div className="admin-stat-card feedback">
                <div className="admin-stat-icon"><Star size={18} /></div>
                <span className="admin-stat-label">Feedback</span>
                <strong>{loading.stats ? "…" : stats?.feedback?.total ?? 0}</strong>
                <span className="admin-stat-hint">
                  {stats?.feedback?.avgRating ? `Avg ${stats.feedback.avgRating}` : "No ratings"} · {stats?.feedback?.lowRatings ?? 0} low
                </span>
              </div>

              <div className="admin-stat-card events">
                <div className="admin-stat-icon"><Calendar size={18} /></div>
                <span className="admin-stat-label">Events</span>
                <strong>{loading.stats ? "…" : stats?.events?.total ?? 0}</strong>
                <span className="admin-stat-hint">{stats?.events?.upcoming ?? 0} upcoming</span>
              </div>

              <div className="admin-stat-card sessions">
                <div className="admin-stat-icon"><Activity size={18} /></div>
                <span className="admin-stat-label">Routes</span>
                <strong>{loading.stats ? "…" : stats?.routes?.total ?? 0}</strong>
                <span className="admin-stat-hint">{stats?.routes?.completed ?? 0} completed</span>
              </div>
            </div>

            <div className="admin-two-col">
              <div className="admin-section">
                <div className="admin-section-header">
                  <h4>Popular places</h4>
                </div>
                {loading.stats ? (
                  <p className="admin-empty">Loading…</p>
                ) : popularPlaces.length === 0 ? (
                  <p className="admin-empty">No place data yet.</p>
                ) : (
                  <ul className="admin-list">
                    {popularPlaces.map((row) => (
                      <li key={row.place.id}>
                        <div>
                          <strong>{row.place.name}</strong>
                          <span>{row.place.category}</span>
                        </div>
                        <div className="admin-pill-group">
                          <span className="admin-pill">
                            <Navigation size={12} /> {row.navigationCount}
                          </span>
                          <span className="admin-pill">
                            <Star size={12} /> {row.favouriteCount}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="admin-section">
                <div className="admin-section-header">
                  <h4>Popular routes</h4>
                </div>
                {loading.stats ? (
                  <p className="admin-empty">Loading…</p>
                ) : popularRoutes.length === 0 ? (
                  <p className="admin-empty">No popular routes yet.</p>
                ) : (
                  <ul className="admin-list">
                    {popularRoutes.map((r, i) => (
                      <li key={`${r.from.id}-${r.to.id}-${i}`}>
                        <div>
                          <strong>{r.from.name} → {r.to.name}</strong>
                          <span>Last used {formatDate(r.lastUsedAt)}</span>
                        </div>
                        <span className="admin-pill">{r.usageCount}×</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="admin-section">
              <div className="admin-section-header">
                <h4>Recent student activity</h4>
                <div className="admin-filter-row">
                  <div className="admin-search-box">
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search name or number"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="admin-btn-text"
                    onClick={loadActivityWithPagination}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {loading.activity ? (
                <p className="admin-empty">Loading…</p>
              ) : activity.length === 0 ? (
                <p className="admin-empty">No logins recorded yet.</p>
              ) : (
                <>
                  <ul className="admin-list">
                    {activity.map((a) => (
                      <li key={a.id}>
                        <div className="admin-user-cell">
                          <div className="admin-avatar-sm">
                            {(a.fullName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{a.fullName || "Unknown"}</strong>
                            <span>{a.studentNumber} · {userRoleLabel(a.role)}</span>
                          </div>
                        </div>
                        <div className="admin-activity-when">
                          <span className="admin-activity-date">
                            {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "—"}
                          </span>
                          <span className="admin-activity-ago">
                            {a.lastLoginAt ? formatRelative(a.lastLoginAt) : ""}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {activityPagination && activityPagination.totalPages > 1 && (
                    <div className="admin-pagination">
                      <button
                        type="button"
                        className="admin-btn-text"
                        disabled={activityPage <= 1}
                        onClick={() => setActivityPage(1)}
                        title="First page"
                      >
                        <ChevronsLeft size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-btn-text"
                        disabled={activityPage <= 1}
                        onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft size={14} /> Prev
                      </button>
                      <span>
                        Page {activityPagination.page} of {activityPagination.totalPages}
                        {" · "}
                        {activityPagination.total} total
                      </span>
                      <button
                        type="button"
                        className="admin-btn-text"
                        disabled={activityPage >= activityPagination.totalPages}
                        onClick={() => setActivityPage((p) => p + 1)}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-btn-text"
                        disabled={activityPage >= activityPagination.totalPages}
                        onClick={() => setActivityPage(activityPagination.totalPages)}
                        title="Last page"
                      >
                        <ChevronsRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ═══════════ EVENTS ═══════════ */}
        {adminTab === "events" && (
          <>
            <div className="admin-section-header">
              <h4>Manage events</h4>
              <div className="admin-filter-row">
                <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                  <option value="all">All events</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
                <button
                  type="button"
                  className="admin-btn-text danger"
                  onClick={deleteAllPastEvents}
                  title="Delete past events"
                >
                  <Archive size={14} /> Clean up
                </button>
                <button
                  type="button"
                  className="admin-btn-primary admin-add-btn"
                  onClick={startNewEvent}
                >
                  <Plus size={16} /> Add event
                </button>
              </div>
            </div>

            {editingEvent && (
              <div className="admin-event-form">
                <div className="admin-form-group">
                  <label>Title</label>
                  <input
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    placeholder="Event title"
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={editingEvent.date}
                      onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Start</label>
                    <input
                      type="time"
                      value={editingEvent.time}
                      onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>End</label>
                    <input
                      type="time"
                      value={editingEvent.endTime || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Location</label>
                  <input
                    value={editingEvent.location}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    placeholder="Building or venue"
                  />
                </div>
                <div className="admin-form-group">
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
                <div className="admin-form-group">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  />
                </div>
                <div className="admin-actions">
                  <button type="button" className="admin-btn-primary" onClick={saveEventEdit}>
                    <Save size={16} /> Save event
                  </button>
                  <button
                    type="button"
                    className="admin-btn-text"
                    onClick={() => setEditingEvent(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading.events ? (
              <p className="admin-empty">Loading events…</p>
            ) : filteredEvents.length === 0 ? (
              <p className="admin-empty">No events to show.</p>
            ) : (
              <ul className="admin-list">
                {filteredEvents.map((ev) => (
                  <li key={ev.id}>
                    <div>
                      <strong>{ev.title}</strong>
                      <span>
                        <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                        {formatDate(ev.date)} · {ev.time}
                        {ev.endTime ? `–${ev.endTime}` : ""}
                        {ev.location ? (
                          <>
                            {" · "}
                            <MapPin size={12} style={{ verticalAlign: "middle", marginRight: 2 }} />
                            {ev.location}
                          </>
                        ) : null}
                      </span>
                    </div>
                    <div className="admin-actions-inline">
                      <button
                        type="button"
                        className="admin-btn-text"
                        onClick={() => setEditingEvent({ ...ev })}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn-text danger"
                        onClick={() => deleteEvent(ev.id)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* ═══════════ FEEDBACK ═══════════ */}
        {adminTab === "feedback" && (
          <>
            <div className="admin-section-header">
              <h4>Ratings &amp; complaints</h4>
              <div className="admin-filter-row">
                <select value={feedbackFilter} onChange={(e) => setFeedbackFilter(e.target.value)}>
                  <option value="all">All feedback</option>
                  <option value="open">Not yet reviewed</option>
                  <option value="reviewed">Already reviewed</option>
                  <option value="low">Low ratings (≤2 stars)</option>
                </select>
                <button type="button" className="admin-btn-text" onClick={loadFeedback}>
                  <RefreshCw size={14} />
                </button>
                <button
                  type="button"
                  className="admin-btn-text danger"
                  onClick={deleteAllFeedback}
                >
                  <Trash2 size={14} /> Delete all matching
                </button>
              </div>
            </div>

            {loading.feedback ? (
              <p className="admin-empty">Loading feedback…</p>
            ) : feedback.length === 0 ? (
              <p className="admin-empty">No feedback to show.</p>
            ) : (
              <ul className="admin-list">
                {feedback.map((f) => (
                  <li
                    key={f.id}
                    className={`feedback-item ${f.rating < 2 ? "low" : ""} ${f.status !== "open" ? "resolved" : ""}`}
                  >
                    <div className="feedback-head">
                      <strong>
                        {"★".repeat(f.rating)}
                        <span style={{ opacity: 0.3 }}>
                          {"★".repeat(Math.max(0, 5 - f.rating))}
                        </span>
                      </strong>
                      <em>{formatDateTime(f.createdAt)}</em>
                    </div>
                    <span className="feedback-meta">
                      {f.user
                        ? `${f.user.fullName || "?"} (${f.user.studentNumber || "?"}) · ${userRoleLabel(f.user.role)}`
                        : "Unknown user"}
                    </span>
                    {f.complaint && (
                      <p className="feedback-complaint">
                        <MessageSquare size={14} /> {f.complaint}
                      </p>
                    )}
                    {f.adminNotes && (
                      <p className="feedback-admin-notes">
                        <Edit3 size={12} /> {f.adminNotes}
                      </p>
                    )}

                    <div className="admin-actions-inline" style={{ marginTop: 8 }}>
                      {f.status === "open" ? (
                        <button
                          type="button"
                          className="admin-btn-text"
                          onClick={() => markFeedbackReviewed(f.id)}
                        >
                          <CheckCircle2 size={14} /> Mark reviewed
                        </button>
                      ) : (
                        <span className="admin-pill">
                          <CheckCircle2 size={12} /> {f.status}
                        </span>
                      )}
                      <button
                        type="button"
                        className="admin-btn-text"
                        onClick={() => saveFeedbackNotes(f.id, f.adminNotes)}
                      >
                        <Edit3 size={14} /> Add note
                      </button>
                      <button
                        type="button"
                        className="admin-btn-text danger"
                        onClick={() => deleteFeedback(f.id)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* ═══════════ USERS ═══════════ */}
        {adminTab === "users" && (
          <>
            <div className="admin-section-header">
              <h4>Users ({users.length})</h4>
              <div className="admin-filter-row">
                <div className="admin-search-box">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search name, number, email"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="all">All roles</option>
                  <option value="student">Students</option>
                  <option value="guest">Guests</option>
                  <option value="admin">Admins</option>
                </select>
                <button type="button" className="admin-btn-text" onClick={loadUsers}>
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {loading.users ? (
              <p className="admin-empty">Loading users…</p>
            ) : users.length === 0 ? (
              <p className="admin-empty">No users match.</p>
            ) : (
              <ul className="admin-list admin-list-users">
                {users.map((u) => {
                  const isMe = u.id === userProfile.id;
                  const isEditingEmail = editingUserEmail?.id === u.id;

                  return (
                    <li key={u.id}>
                      <div className="admin-user-cell">
                        <div className="admin-avatar-sm">
                          {(u.fullName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="admin-user-details">
                          <div className="admin-user-line">
                            <strong>{u.fullName || "Unknown"}</strong>
                            <span className={`admin-role-badge role-${u.role}`}>
                              {userRoleLabel(u.role)}
                            </span>
                            {isMe && <span className="admin-you-badge">You</span>}
                          </div>
                          <span className="admin-user-line-sub">
                            {u.studentNumber}
                            {u.email ? ` · ${u.email}` : u.phone ? ` · ${u.phone}` : ""}
                          </span>
                          <span className="admin-user-dates">
                            <span>
                              <Clock size={11} /> Joined {formatDate(u.createdAt)}
                            </span>
                            <span>
                              <Activity size={11} /> Last login{" "}
                              {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "never"}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="admin-actions-inline">
                        {isEditingEmail ? (
                          <>
                            <input
                              type="email"
                              value={editingUserEmail.email || ""}
                              onChange={(e) =>
                                setEditingUserEmail((s) => ({ ...s, email: e.target.value }))
                              }
                              className="admin-inline-input"
                              placeholder="new@email.com"
                              autoFocus
                            />
                            <button
                              type="button"
                              className="admin-btn-text"
                              onClick={saveUserEmail}
                            >
                              <CheckCircle2 size={14} /> Save
                            </button>
                            <button
                              type="button"
                              className="admin-btn-text"
                              onClick={() => setEditingUserEmail(null)}
                            >
                              <X size={14} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="admin-btn-text"
                              onClick={() =>
                                setEditingUserEmail({ id: u.id, email: u.email || "" })
                              }
                              title="Change email"
                            >
                              <Edit3 size={14} /> Email
                            </button>
                            <button
                              type="button"
                              className="admin-btn-text danger"
                              onClick={() => deleteUser(u.id)}
                              disabled={isMe}
                              title={isMe ? "You cannot delete your own account" : "Delete user"}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* ═══════════ ANALYTICS ═══════════ */}
        {adminTab === "analytics" && (
          <>
            <div className="admin-section-header">
              <h4>Campus analytics</h4>
              <button type="button" className="admin-btn-text" onClick={loadAnalytics}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div className="admin-two-col">
              <div className="admin-section">
                <div className="admin-section-header">
                  <h4>Popular places</h4>
                </div>
                <div className="admin-search-box" style={{ marginBottom: 12, width: "100%" }}>
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Filter places"
                    value={analyticsPlaceSearch}
                    onChange={(e) => setAnalyticsPlaceSearch(e.target.value)}
                  />
                </div>
                {loading.stats ? (
                  <p className="admin-empty">Loading…</p>
                ) : (
                  (() => {
                    const filtered = analyticsPlaces.filter((p) =>
                      p.place.name.toLowerCase().includes(analyticsPlaceSearch.toLowerCase())
                    );
                    if (!filtered.length) return <p className="admin-empty">No places match.</p>;
                    return (
                      <ul className="admin-list">
                        {filtered.map((row) => (
                          <li key={row.place.id}>
                            <div>
                              <strong>{row.place.name}</strong>
                              <span>{row.place.category}</span>
                            </div>
                            <div className="admin-pill-group">
                              <span className="admin-pill">
                                <Navigation size={12} /> {row.navigationCount}
                              </span>
                              <span className="admin-pill">
                                <Star size={12} /> {row.favouriteCount}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    );
                  })()
                )}
              </div>

              <div className="admin-section">
                <div className="admin-section-header">
                  <h4>Popular routes</h4>
                </div>
                <div className="admin-search-box" style={{ marginBottom: 12, width: "100%" }}>
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Filter routes"
                    value={analyticsRouteSearch}
                    onChange={(e) => setAnalyticsRouteSearch(e.target.value)}
                  />
                </div>
                {loading.stats ? (
                  <p className="admin-empty">Loading…</p>
                ) : (
                  (() => {
                    const filtered = analyticsRoutes.filter((r) =>
                      `${r.from.name} ${r.to.name}`
                        .toLowerCase()
                        .includes(analyticsRouteSearch.toLowerCase())
                    );
                    if (!filtered.length) return <p className="admin-empty">No routes match.</p>;
                    return (
                      <ul className="admin-list">
                        {filtered.map((r, i) => (
                          <li key={`${r.from.id}-${r.to.id}-${i}`}>
                            <div>
                              <strong>{r.from.name} → {r.to.name}</strong>
                              <span>Last used {formatDate(r.lastUsedAt)}</span>
                            </div>
                            <span className="admin-pill">{r.usageCount}×</span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()
                )}
              </div>
            </div>
          </>
        )}

        {/* ═══════════ PLACES ═══════════ */}
        {adminTab === "places" && (
          <>
            <div className="admin-section-header">
              <h4>Campus places ({placePagination?.total ?? adminPlaces.length})</h4>
              <div className="admin-filter-row">
                <div className="admin-search-box">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search name, code, slug"
                    value={placeSearch}
                    onChange={(e) => setPlaceSearch(e.target.value)}
                  />
                </div>
                <select
                  value={placeCategoryFilter}
                  onChange={(e) => setPlaceCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  <option value="academic">Academic</option>
                  <option value="residence">Residence</option>
                  <option value="support">Support</option>
                  <option value="recreation">Recreation</option>
                  <option value="commercial">Commercial</option>
                  <option value="parking">Parking</option>
                  <option value="admin">Admin</option>
                  <option value="other">Other</option>
                </select>
                <button type="button" className="admin-btn-text" onClick={loadPlaces}>
                  <RefreshCw size={14} />
                </button>
                <button
                  type="button"
                  className="admin-btn-primary admin-add-btn"
                  onClick={startNewPlace}
                >
                  <Plus size={16} /> Add place
                </button>
              </div>
            </div>

            {editingPlace && (
              <div className="admin-event-form">
                <div className="admin-form-group">
                  <label>Name</label>
                  <input
                    value={editingPlace.name}
                    onChange={(e) => setEditingPlace({ ...editingPlace, name: e.target.value })}
                    placeholder="e.g. New Science Lab"
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Slug (auto if empty)</label>
                    <input
                      value={editingPlace.slug}
                      onChange={(e) => setEditingPlace({ ...editingPlace, slug: e.target.value })}
                      placeholder="e.g. new-science-lab"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Code</label>
                    <input
                      value={editingPlace.code}
                      onChange={(e) => setEditingPlace({ ...editingPlace, code: e.target.value })}
                      placeholder="e.g. NSL"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Category</label>
                    <select
                      value={editingPlace.category}
                      onChange={(e) =>
                        setEditingPlace({ ...editingPlace, category: e.target.value })
                      }
                    >
                      <option value="academic">Academic</option>
                      <option value="residence">Residence</option>
                      <option value="support">Support</option>
                      <option value="recreation">Recreation</option>
                      <option value="commercial">Commercial</option>
                      <option value="parking">Parking</option>
                      <option value="admin">Admin</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editingPlace.latitude}
                      onChange={(e) =>
                        setEditingPlace({ ...editingPlace, latitude: e.target.value })
                      }
                      placeholder="-23.8884"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editingPlace.longitude}
                      onChange={(e) =>
                        setEditingPlace({ ...editingPlace, longitude: e.target.value })
                      }
                      placeholder="29.7386"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Visibility</label>
                    <select
                      value={editingPlace.is_active ? "active" : "hidden"}
                      onChange={(e) =>
                        setEditingPlace({
                          ...editingPlace,
                          is_active: e.target.value === "active",
                        })
                      }
                    >
                      <option value="active">Active (visible)</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>
                <div className="admin-actions">
                  <button type="button" className="admin-btn-primary" onClick={savePlaceEdit}>
                    <Save size={16} />
                    {editingPlace.id ? " Save changes" : " Add place"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn-text"
                    onClick={() => setEditingPlace(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <p className="admin-hint">
              Places are the markers on the student map. Deactivate to hide without deleting.
            </p>

            {loading.places ? (
              <p className="admin-empty">Loading places…</p>
            ) : adminPlaces.length === 0 ? (
              <p className="admin-empty">No places match.</p>
            ) : (
              <ul className="admin-list">
                {adminPlaces.map((p) => (
                  <li key={p.id}>
                    <div>
                      <strong>{p.name}</strong>
                      <span>
                        {p.slug} · {p.category}
                        {p.code ? ` · ${p.code}` : ""}
                      </span>
                    </div>
                    <div className="admin-actions-inline">
                      <span className={`admin-pill ${p.is_active ? "success" : "muted"}`}>
                        {p.is_active ? (
                          <>
                            <Eye size={12} /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} /> Hidden
                          </>
                        )}
                      </span>
                      <button
                        type="button"
                        className="admin-btn-text"
                        onClick={() => setEditingPlace({ ...p })}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn-text"
                        onClick={() => togglePlace(p)}
                      >
                        {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        {p.is_active ? " Deactivate" : " Activate"}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-text danger"
                        onClick={() => deletePlace(p)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
      <Toast toasts={toasts} onClose={dismissToast} />
    </div>
  );
}