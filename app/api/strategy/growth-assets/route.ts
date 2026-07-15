import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  createProductLine,
  getGrowthAssetsBundle,
  saveBrandCards,
  saveJtbd,
  saveRoadmap,
} from "@/lib/strategy/growth-assets";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  return NextResponse.json(await getGrowthAssetsBundle());
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const b = await req.json();
    switch (b.kind) {
      case "productLine":
        await createProductLine(b.row ?? {});
        break;
      case "roadmap":
        await saveRoadmap(b.rows ?? []);
        break;
      case "jtbd":
        await saveJtbd(b.rows ?? []);
        break;
      case "brandCards":
        await saveBrandCards(b.rows ?? []);
        break;
      default:
        return NextResponse.json({ error: "kind 非法" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, bundle: await getGrowthAssetsBundle() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 400 },
    );
  }
}
