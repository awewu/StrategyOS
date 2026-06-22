import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getOutlookBundle, saveOutlookBundle } from "@/lib/fpa/outlook-access";
import type { FpaYearRow, SensitivityDriver } from "@/lib/types/stratos";
import { getActivePeriod } from "@/lib/data/active-period";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const bundle = await getOutlookBundle(await getActivePeriod());
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      fiveYearForecast?: FpaYearRow[];
      sensitivityDrivers?: SensitivityDriver[];
      period?: string;
    };
    if (!body.fiveYearForecast || !body.sensitivityDrivers) {
      return NextResponse.json({ error: "fiveYearForecast 与 sensitivityDrivers 必填" }, { status: 400 });
    }
    const saved = await saveOutlookBundle(
      {
        fiveYearForecast: body.fiveYearForecast,
        sensitivityDrivers: body.sensitivityDrivers,
      },
      body.period ?? await getActivePeriod(),
    );
    return NextResponse.json({ ok: true, ...saved });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
