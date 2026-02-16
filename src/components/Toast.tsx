import { useToastStore, type Toast as ToastType } from "../store/toastStore";
import { IconCheck, IconCross } from "./Icons";

function getToastColor(type: ToastType["type"]): string {
  switch (type) {
    case "success":
      return "var(--main-purple)";
    case "error":
      return "var(--red)";
    default:
      return "var(--medium-grey)";
  }
}

function ToastItem({ toast }: Readonly<{ toast: ToastType }>) {
  const { removeToast } = useToastStore();
  const bgColor = getToastColor(toast.type);

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-70 animate-slide-in"
      style={{ backgroundColor: bgColor }}
    >
      {toast.type === "success" && (
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <IconCheck />
        </div>
      )}
      <span className="body-l flex-1">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 hover:opacity-75 transition-opacity shrink-0"
        aria-label="Dismiss notification"
      >
        <IconCross className="text-white" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 flex flex-col gap-3"
      style={{ zIndex: 9999 }}
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
