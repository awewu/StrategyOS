import { NextResponse } from "next/server";
import {
  DEFAULT_SIM_PARAMS,
  runStratSim,
  simWarnings,
  type SimParams,
} from "@/lib/stratos/strat-sim";
import { runStratSimDynamics } from "@/lib/stratos/strat-sim-dynamics";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    horizonQuarters?: number;
    params?: Partial<SimParams>;
    mode?: "discrete" | "dynamics";
  };

  const params: SimParams = { ...DEFAULT_SIM_PARAMS, ...body.params };
  const horizon = body.horizonQuarters ?? 8;
  const mode = body.mode ?? "dynamics";

  const trail =
    mode === "dynamics"
      ? runStratSimDynamics(horizon, params)
      : runStratSim(horizon, params);

  return NextResponse.json({
    trail,
    warnings: simWarnings(trail),
    mode,
  });
}
