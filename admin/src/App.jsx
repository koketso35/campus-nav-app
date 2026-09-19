import  { useState, useEffect } from "react";
import { api, setToken, getToken, clearToken } from "./api/client";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(() => !!getToken());
  const [message, setMessage] = useState("");

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    api
      .me()
      .then((res) => {
        if (res.data?.role !== "admin") {
          clearToken();
          setMessage("This account does not have admin access.");
          setUserProfile(null);
        } else {
          setUserProfile(res.data);
        }
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => setBootstrapping(false));
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const res = await api.login({ email, password });
      setToken(res.data.accessToken);

      const meRes = await api.me();
      if (meRes.data?.role !== "admin") {
        clearToken();
        setMessage("This account does not have admin access.");
        return;
      }

      setUserProfile(meRes.data);
      setMessage("");
    } catch (err) {
      if (err.status === 401) setMessage("Invalid email or password.");
      else if (err.status === 403) setMessage("Please verify your email first.");
      else setMessage(err.message || "Login failed. Please try again.");
    }
  };

  const handleLogout = () => {
    api.logout().catch(() => {});
    clearToken();
    setUserProfile(null);
    setMessage("You have been signed out.");
  };

  if (bootstrapping) {
    return (
      <div className="admin-splash">
        <div className="admin-splash-card">
          <img
            src="/ul-logo.jpeg"
            alt="University of Limpopo"
            className="admin-splash-logo"
          />
          <div className="admin-splash-title">Admin Console</div>
          <div className="admin-splash-spinner" />
          <div className="admin-splash-text">Restoring session…</div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <AdminLogin onSubmit={handleLogin} message={message} />;
  }

  return <AdminDashboard userProfile={userProfile} onLogout={handleLogout} />;
}