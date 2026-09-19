import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

function ToastItem({ id, message, variant, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 3500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const Icon = variant === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className={`toast-item toast-${variant}`} role="status">
      <Icon size={18} />
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function Toast({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          id={t.id}
          message={t.message}
          variant={t.variant}
          onClose={onClose}
        />
      ))}
    </div>
  );
}