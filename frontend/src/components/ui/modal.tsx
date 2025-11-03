import * as React from "react";
import * as ReactDOM from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : null}
            {description ? <p className="text-sm text-slate-600">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-slate-100 px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
