import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { dbAvailable, prisma } from "@/lib/db";
import { onReportApproved } from "@/lib/delivery/hooks";
import { parseReportSmart } from "@/lib/stratos/llm-agent";
import { formatMonthlyPulse, parseReportContent } from "@/lib/stratos/report-agent";
import { checkPulseDuplicate } from "@/lib/reports/pulse-dedup";

export const runtime = "nodejs";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "reports");
const MAX_BYTES = 80 * 1024 * 1024;
const ALLOWED_EXT = /\.(docx|xlsx|pdf|pptx|doc|xls|ppt)$/i;

/** Best-effort text extraction from OOXML zip formats (docx/xlsx/pptx) — no extra deps */
async function extractText(bytes: Buffer, ext: string): Promise<string> {
  try {
    if (/docx/i.test(ext)) {
      return (await readZipEntry(bytes, "word/document.xml"))
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 40000);
    }
    if (/xlsx/i.test(ext)) {
      return (await readZipEntry(bytes, "xl/sharedStrings.xml"))
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 40000);
    }
    if (/pptx/i.test(ext)) {
      return (await readZipEntriesMatching(bytes, /^ppt\/slides\/slide\d+\.xml$/))
        .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 40000);
    }
  } catch { /* best-effort */ }
  return "";
}

async function readZipEntry(buf: Buffer, targetName: string): Promise<string> {
  let offset = 0;
  while (offset < buf.length - 30) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) { offset++; continue; }
    const fnLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + fnLen).toString("utf8");
    const dataStart = offset + 30 + fnLen + extraLen;
    const compSize = buf.readUInt32LE(offset + 18);
    if (name === targetName && compSize > 0) {
      const { inflateRawSync } = await import("node:zlib");
      const compressed = buf.subarray(dataStart, dataStart + compSize);
      const raw = buf.readUInt16LE(offset + 8) === 8 ? inflateRawSync(compressed) : compressed;
      return raw.toString("utf8");
    }
    offset = dataStart + compSize;
  }
  return "";
}

async function readZipEntriesMatching(buf: Buffer, pattern: RegExp): Promise<string> {
  const { inflateRawSync } = await import("node:zlib");
  const parts: string[] = [];
  let offset = 0;
  while (offset < buf.length - 30) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) { offset++; continue; }
    const fnLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + fnLen).toString("utf8");
    const dataStart = offset + 30 + fnLen + extraLen;
    const compSize = buf.readUInt32LE(offset + 18);
    if (pattern.test(name) && compSize > 0) {
      try {
        const compressed = buf.subarray(dataStart, dataStart + compSize);
        const raw = buf.readUInt16LE(offset + 8) === 8 ? inflateRawSync(compressed) : compressed;
        parts.push(raw.toString("utf8"));
      } catch { /* skip bad entry */ }
    }
    offset = dataStart + compSize;
  }
  return parts.join(" ");
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(1);
  if (denied) return denied;
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const orgUnitId = (form.get("orgUnitId") as string | null) ?? undefined;
    const reportType = (form.get("reportType") as string | null) ?? "MON_PULSE";
    const period = (form.get("period") as string | null) ?? new Date().toISOString().slice(0, 7);
    const title = (form.get("title") as string | null) ?? "上传报告";
    const rawContent = (form.get("rawContent") as string | null) ?? "";
    const oneLiner = (form.get("oneLiner") as string | null) ?? "";
    const offTrackKr = (form.get("offTrackKr") as string | null) ?? "";
    const needHelp = (form.get("needHelp") as string | null) ?? "";

    const isPulse = reportType === "MON_PULSE";

    if (isPulse) {
      if (!oneLiner.trim()) {
        return NextResponse.json({ error: "本月一句话 oneLiner 必填" }, { status: 400 });
      }
    } else if (!file && !rawContent.trim()) {
      return NextResponse.json({ error: "file 或 rawContent 至少填一项" }, { status: 400 });
    }

    const needsOrg = ["MON_PULSE", "MON_RPT", "QTR_REV", "ANNUAL_RPT"].includes(reportType);
    if (needsOrg && !orgUnitId) {
      return NextResponse.json({ error: "运营月报/复盘必须选择组织单元 orgUnitId" }, { status: 400 });
    }

    let extractedText = rawContent;
    let filePath: string | undefined;
    let fileOrigName: string | undefined;
    let fileMime: string | undefined;
    let fileSizeBytes: number | undefined;

    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      if (!ALLOWED_EXT.test(file.name)) {
        return NextResponse.json({ error: "不支持的文件类型" }, { status: 415 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "文件不能超过 80 MB" }, { status: 413 });
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const savedName = randomUUID() + "." + ext;
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(join(UPLOAD_DIR, savedName), bytes);
      filePath = "/uploads/reports/" + savedName;
      fileOrigName = file.name;
      fileMime = file.type || "application/octet-stream";
      fileSizeBytes = file.size;
      if (!extractedText.trim()) {
        extractedText = await extractText(bytes, ext);
      }
    }

    const reportId = "RPT-" + randomUUID().slice(0, 8).toUpperCase();

    if (isPulse) {
      extractedText = formatMonthlyPulse({ oneLiner, offTrackKr, needHelp });

      const forceSubmit = String(form.get("forceSubmit") ?? "") === "1";
      if (orgUnitId && (await dbAvailable())) {
        const dup = await checkPulseDuplicate(orgUnitId, period, { oneLiner, offTrackKr, needHelp });
        if (dup.isDuplicate && !forceSubmit) {
          return NextResponse.json(
            {
              ok: false,
              error: "duplicate_pulse",
              duplicate: dup,
              message: dup.message,
            },
            { status: 409 },
          );
        }
      }

      const parsed = parseReportContent(reportId, extractedText, period);
      if (offTrackKr.trim()) {
        parsed.coverageUpdates.push(`偏离KR: ${offTrackKr.trim()}`);
      }
      if (needHelp.trim()) {
        parsed.agentTrace.push(`需协调: ${needHelp.trim()}`);
      }

      if (await dbAvailable()) {
        await prisma.report.create({
          data: {
            id: reportId,
            reportType: "MON_PULSE",
            period,
            title,
            rawContent: extractedText,
            parsedJson: parsed as object,
            orgUnitId: orgUnitId || undefined,
            approvalStatus: "PENDING",
          },
        });
      }

      return NextResponse.json({ ok: true, reportId, extracted: extractedText.length, duplicateChecked: true });
    }

    const { parsed } = await parseReportSmart(reportId, extractedText || title, period, false);

    if (await dbAvailable()) {
      await prisma.report.create({
        data: {
          id: reportId,
          reportType: reportType as never,
          period,
          title,
          rawContent: extractedText || undefined,
          parsedJson: parsed as object,
          orgUnitId: orgUnitId || undefined,
          approvalStatus: "PENDING",
          filePath,
          fileOrigName,
          fileMime,
          fileSizeBytes,
        },
      });
    }

    return NextResponse.json({ ok: true, reportId, extracted: extractedText.length });
  } catch (e) {
    console.error("report submit error", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "上传失败" }, { status: 500 });
  }
}

/** Approve or reject a submitted report */
export async function PATCH(req: Request) {
  const { requireApiMinLevel } = await import("@/lib/auth/api-guard");
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  const { id, action } = (await req.json()) as { id: string; action: "APPROVED" | "REJECTED" };
  if (!id || !["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }
  if (!(await dbAvailable())) return NextResponse.json({ error: "db unavailable" }, { status: 503 });
  const updated = await prisma.report.update({
    where: { id },
    data: { approvalStatus: action },
  });
  if (action === "APPROVED") {
    await onReportApproved(updated.id).catch(() => undefined);
  }
  return NextResponse.json({ ok: true, id: updated.id, approvalStatus: updated.approvalStatus });
}
