"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "./Icon";

export type ToastTone = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // ms before auto-dismiss, undefined = manual only
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nextId, setNextId] = useState(1);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = String(nextId++);
    const newToast: Toast = { id, duration: 4000, ...toast };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration
    if (newToast.duration !== undefined && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, [nextId]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Toast container - fixed bottom-right */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-6 right-6 z-[100] flex max-w-sm flex-col gap-3"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleAction = useCallback(() => {
    toast.onAction?.();
    handleClose();
  }, [toast, handleClose]);

  const toneStyles = {
    success: "bg-surface border-l-4 border-success",
    error: "bg-surface border-l-4 border-error",
    info: "bg-surface border-l-4 border-info",
    warning: "bg-surface border-l-4 border-warning",
  }[toast.tone];

  const iconColors = {
    success: "text-success",
    error: "text-error",
    info: "text-info",
    warning: "text-warning",
  }[toast.tone];

  const icons: Record<ToastTone, string> = {
    success: "check-circle",
    error: "alert-octagon",
    info: "information",
    warning: "alert",
  };

  return (
    <div
      role="status"
      className={clsx(
        "flex min-h-[56px] items-start gap-3 rounded-lg border border-line p-4 shadow-lg",
        toneStyles
      )}
    >
      <Icon
        name={icons[toast.tone]}
        size={20}
        className={clsx("shrink-0 mt-0.5", iconColors)}
      />
      <div className="flex flex-1 items-center gap-3">
        <p className="text-sm font-medium text-ink">{toast.message}</p>
        {toast.actionLabel && (
          <button
            type="button"
            onClick={handleAction}
            className="text-xs font-semibold underline decoration-1 opacity-80 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {toast.actionLabel}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Dismiss notification"
        className="pressable cursor-pointer p-1 text-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
