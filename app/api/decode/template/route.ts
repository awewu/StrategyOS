import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  buildBscTemplateWorkbook,
  buildCombinedTemplateWorkbook,
  buildHoshinTemplateWorkbook,
} from "@/lib/decode/excel";

export async function GET(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "combined";

  let buffer: Buffer;
  let filename: string;
  switch (type) {
    case "bsc":
      buffer = buildBscTemplateWorkbook();
      filename = "stratos-decode-bsc-template.xlsx";
      break;
    case "hoshin":
      buffer = buildHoshinTemplateWorkbook();
      filename = "stratos-decode-hoshin-template.xlsx";
      break;
    default:
      buffer = buildCombinedTemplateWorkbook();
      filename = "stratos-decode-template.xlsx";
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
