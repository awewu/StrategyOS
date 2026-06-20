"use client";

export function DownloadPdfButton({ lang = "zh" }: { lang?: "zh" | "en" }) {
  async function download() {
    const res = await fetch(`/api/print/panorama?lang=${lang}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="([^"]+)"/);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = match?.[1] ?? `stratos-panorama-${lang}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="rounded border border-[var(--surface-border-strong)] px-4 py-2 text-sm print:hidden"
    >
      {lang === "zh" ? "下载中文 PDF" : "Download PDF (EN)"}
    </button>
  );
}
