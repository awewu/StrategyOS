import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { extractTextFromDocumentDetailed } from "@/lib/compiler/strategic-compiler";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "请选择需要提取的文件" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "文件不能超过 100 MB" }, { status: 413 });
    }

    const extraction = await extractTextFromDocumentDetailed(Buffer.from(await file.arrayBuffer()), file.name);
    const { text } = extraction;
    if (!text) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const error = ext === "pdf"
        ? "PDF 常规提取和自动 OCR 均未识别到文本"
        : "文件中没有识别到可提取文本";
      return NextResponse.json({ error, fileName: file.name }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      text,
      charCount: text.length,
      method: extraction.method,
      model: extraction.model,
      pageCount: extraction.pageCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "文本提取失败" },
      { status: 400 },
    );
  }
}
