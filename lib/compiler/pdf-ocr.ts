import { createCanvas } from "@napi-rs/canvas";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";

const OCR_BATCH_SIZE = 3;
const OCR_MAX_PAGES = 40;

function apiKey(): string | undefined {
  return process.env.STRATOS_LLM_API_KEY ?? process.env.OPENAI_API_KEY;
}

function baseUrl(): string {
  return (process.env.STRATOS_LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "");
}

function model(): string {
  return process.env.STRATOS_OCR_MODEL ?? "qwen-vl-plus";
}

function ensurePdfJsPolyfills() {
  const global = globalThis as Record<string, unknown>;
  if (!global.DOMMatrix) {
    global.DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      multiply() { return this; }
      translate() { return this; }
      scale() { return this; }
      rotate() { return this; }
      inverse() { return this; }
      transformPoint(point?: { x?: number; y?: number }) {
        return { x: point?.x ?? 0, y: point?.y ?? 0, z: 0, w: 1 };
      }
    };
  }
  if (!global.ImageData) {
    global.ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray, width: number, height = 0) {
        this.data = data;
        this.width = width;
        this.height = height || Math.floor(data.length / Math.max(width * 4, 1));
      }
    };
  }
  if (!global.Path2D) global.Path2D = class Path2D {};
}

async function recognizeBatch(images: string[], firstPage: number): Promise<string> {
  const key = apiKey();
  if (!key) throw new Error("自动 OCR 未配置百炼 API Key");
  const content: Array<Record<string, unknown>> = [{
    type: "text",
    text: `请对接下来的 ${images.length} 张 PDF 页面图片进行 OCR。它们依次是第 ${firstPage} 页到第 ${firstPage + images.length - 1} 页。逐页完整抄录所有可见文字和表格内容，不要总结、解释或补写。每页以【OCR 第 N 页】开头。`,
  }];
  for (const image of images) content.push({ type: "image_url", image_url: { url: image } });

  const response = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model(),
      temperature: 0,
      max_tokens: 8000,
      messages: [{ role: "user", content }],
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`自动 OCR 服务返回 HTTP ${response.status}: ${detail.slice(0, 300)}`);
  }
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("自动 OCR 未返回文本");
  return text;
}

export async function ocrPdfWithBailian(buffer: Buffer): Promise<{ text: string; pageCount: number; model: string }> {
  ensurePdfJsPolyfills();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfRoot = join(process.cwd(), "node_modules", "pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(join(pdfRoot, "legacy", "build", "pdf.worker.mjs")).href;
  const fileUrl = (path: string) => pathToFileURL(path.endsWith(sep) ? path : path + sep).href;
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: fileUrl(join(pdfRoot, "standard_fonts")),
    cMapUrl: fileUrl(join(pdfRoot, "cmaps")),
    cMapPacked: true,
    wasmUrl: fileUrl(join(pdfRoot, "wasm")),
  });
  const pdf = await loadingTask.promise;
  const pageCount = Math.min(pdf.numPages, OCR_MAX_PAGES);
  const results: string[] = [];
  try {
    for (let start = 1; start <= pageCount; start += OCR_BATCH_SIZE) {
      const images: string[] = [];
      const end = Math.min(start + OCR_BATCH_SIZE - 1, pageCount);
      for (let pageNumber = start; pageNumber <= end; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.6 });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        const context = canvas.getContext("2d");
        await page.render({
          canvas: null,
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport,
        }).promise;
        const jpeg = canvas.toBuffer("image/jpeg", 82);
        images.push(`data:image/jpeg;base64,${jpeg.toString("base64")}`);
        page.cleanup();
      }
      results.push(await recognizeBatch(images, start));
    }
  } finally {
    await pdf.destroy();
  }
  if (pdf.numPages > OCR_MAX_PAGES) results.push(`【提示】仅 OCR 前 ${OCR_MAX_PAGES} 页，共 ${pdf.numPages} 页。`);
  return { text: results.join("\n\n").trim(), pageCount: pdf.numPages, model: model() };
}
