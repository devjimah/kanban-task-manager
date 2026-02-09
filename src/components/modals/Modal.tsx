import { useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
}: Readonly<ModalProps>) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  // Trap focus within modal
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      // Focus the modal content
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        firstFocusable?.focus();
      }, 10);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";

      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative w-full max-w-120 max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-md"
        style={{ backgroundColor: "var(--bg-secondary)" }}
        onClick={handleContentClick}
      >
        {title && (
          <h2
            id="modal-title"
            className="heading-l mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
