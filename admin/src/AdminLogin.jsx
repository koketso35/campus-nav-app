import { useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";

export default function AdminLogin({ onSubmit, message }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await onSubmit(email.trim().toLowerCase(), password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <img src="/ul-logo.jpeg" alt="University of Limpopo" className="admin-login-logo" />
          <div>
            <div className="admin-login-uni">University of Limpopo</div>
            <h1 className="admin-login-title">Admin Console</h1>
            <p className="admin-login-sub">Campus Navigator - Control centre</p>
          </div>
        </div>

        {message && <div className="admin-login-msg">{message}</div>}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>
              <Mail size={14} /> Email address
            </label>
            <input
              type="email"
              placeholder="admin@ul.ac.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="admin-form-group">
            <label>
              <Lock size={14} /> Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <label className="admin-checkbox-row">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Show password
          </label>

          <button type="submit" className="admin-btn-primary" disabled={loading}>
            <LogIn size={16} /> {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="admin-login-footer">
          Admin accounts are provisioned by campus IT.
        </div>
      </div>
    </div>
  );
}