import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getDecodePeriod, saveDecodeBsc, saveDecodeHoshin } from "@/lib/decode/data-access";
import { parseBscExcel, parseHoshinExcel } from "@/lib/decode/excel";

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "combined").toLowerCase();
    const period = String(form.get("period") ?? getDecodePeriod());

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "请上传 Excel 文件 (.xlsx)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result: { bsc?: number; hoshin?: number; period: string } = { period };

    if (kind === "bsc" || kind === "combined") {
      try {
        const rows = parseBscExcel(buffer);
        const saved = await saveDecodeBsc(rows, period);
        result.bsc = saved.count;
      } catch (e) {
        if (kind === "bsc") throw e;
      }
    }

    if (kind === "hoshin" || kind === "combined") {
      try {
        const rows = parseHoshinExcel(buffer);
        const saved = await saveDecodeHoshin(rows, period);
        result.hoshin = saved.count;
      } catch (e) {
        if (kind === "hoshin") throw e;
      }
    }

    if (result.bsc == null && result.hoshin == null) {
      return NextResponse.json(
        { error: "未能从文件中解析 BSC 或 Hoshin 工作表 — 请下载模板填写" },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "导入失败" }, { status: 500 });
  }
}
