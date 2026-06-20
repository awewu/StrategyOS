"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[#0a1628] print:hidden"
    >
      打印 / 存 PDF
    </button>
  );
}
