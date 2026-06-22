import { NextResponse } from "next/server";
import * as demo from "@/lib/stratos-demo-data";
import {
  clearScoreboardConfig,
  getScoreboardConfig,
  parseScoreboardConfig,
  saveScoreboardConfig,
} from "@/lib/execution/scoreboard-access";

export async function GET() {
  const result = await getScoreboardConfig(demo.CURRENT_PERIOD);
  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      period?: string;
      config?: unknown;
      reset?: boolean;
    };
    const period = body.period ?? demo.CURRENT_PERIOD;

    if (body.reset) {
      await clearScoreboardConfig(period);
      return NextResponse.json(await getScoreboardConfig(period));
    }
    if (body.config) {
      const config = parseScoreboardConfig(body.config);
      const saved = await saveScoreboardConfig(config, period);
      return NextResponse.json(saved);
    }
    return NextResponse.json({ error: "缺少 config / reset" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 400 },
    );
  }
}
