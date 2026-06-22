import { NextResponse } from "next/server";
import * as demo from "@/lib/stratos-demo-data";
import {
  clearAllManagementAdjustments,
  clearManagementMarginBridge,
  clearManagementStatements,
  getManagementAdjustments,
  saveManagementMarginBridge,
  saveManagementStatements,
  type StatementsOverride,
} from "@/lib/fpa/management-adjustments-access";
import { validateMarginBridge, validateStatementsOverride } from "@/lib/fpa/management-validate";
import type { MarginBridgeItem } from "@/lib/fpa/management-types";

export async function GET() {
  const bundle = await getManagementAdjustments(demo.CURRENT_PERIOD);
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      period?: string;
      marginBridge?: MarginBridgeItem[];
      statements?: StatementsOverride;
      reset?: "all" | "marginBridge" | "statements";
    };
    const period = body.period ?? demo.CURRENT_PERIOD;

    if (body.reset === "all") {
      await clearAllManagementAdjustments(period);
      return NextResponse.json(await getManagementAdjustments(period));
    }
    if (body.reset === "marginBridge") {
      await clearManagementMarginBridge(period);
      return NextResponse.json(await getManagementAdjustments(period));
    }
    if (body.reset === "statements") {
      await clearManagementStatements(period);
      return NextResponse.json(await getManagementAdjustments(period));
    }
    if (body.marginBridge) {
      validateMarginBridge(body.marginBridge);
      return NextResponse.json(await saveManagementMarginBridge(body.marginBridge, period));
    }
    if (body.statements) {
      validateStatementsOverride(body.statements);
      return NextResponse.json(await saveManagementStatements(body.statements, period));
    }
    return NextResponse.json({ error: "缺少 marginBridge / statements / reset" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 400 },
    );
  }
}
