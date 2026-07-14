"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * StratOS overlay primitives — unified <Modal> / <Drawer>.
 *
 * Shared behavior (useOverlay):
 * - ESC closes
 * - Backdrop click closes (inner clicks stopped)
 * - Body scroll lock while mounted
 * - Focus trap (Tab cycles inside; initial focus on panel)
 * - 200ms enter transition (fade backdrop + scale/slide panel)
 * - role="dialog" aria-modal
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useOverlay(onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevActive = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || active === panelRef.current) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
  }, [onClose]);

  const onBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return { panelRef, onBackdropClick };
}

const MODAL_SIZE = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-3xl",
} as const;

export function Modal({
  onClose,
  title,
  subtitle,
  size = "lg",
  children,
}: {
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: keyof typeof MODAL_SIZE;
  children: React.ReactNode;
}) {
  const { panelRef, onBackdropClick } = useOverlay(onClose);
  return (
    <div
      className="stratos-overlay-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onBackdropClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`stratos-overlay-panel max-h-[88vh] w-full ${MODAL_SIZE[size]} overflow-y-auto rounded-xl border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-5 shadow-xl outline-none`}
      >
        {title !== undefined && (
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
        )}
        {subtitle !== undefined && (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{subtitle}</p>
        )}
        {(title !== undefined || subtitle !== undefined) && <div className="mt-4" />}
        {children}
      </div>
    </div>
  );
}

const DRAWER_SIZE = {
  md: "max-w-md",
  lg: "max-w-lg",
} as const;

export function Drawer({
  onClose,
  size = "lg",
  children,
}: {
  onClose: () => void;
  size?: keyof typeof DRAWER_SIZE;
  children: React.ReactNode;
}) {
  const { panelRef, onBackdropClick } = useOverlay(onClose);
  return (
    <div
      className="stratos-overlay-backdrop fixed inset-0 z-40 flex justify-end bg-black/20"
      onClick={onBackdropClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`stratos-drawer-panel h-full w-full ${DRAWER_SIZE[size]} overflow-y-auto border-l border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-5 outline-none`}
      >
        {children}
      </div>
    </div>
  );
}
