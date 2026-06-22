import { NextResponse } from "next/server";
import {
  DEFAULT_SIM_PARAMS,
  runStratSim,
  simWarnings,
  type SimParams,
} from "@/lib/stratos/strat-sim";
import {
  DEFAULT_DYNAMICS_INITIAL,
  runStratSimDynamics,
} from "@/lib/stratos/strat-sim-dynamics";
import { deriveDynamicsInitial, deriveSimSeed } from "@/lib/stratos/calibrate";
import { getDataSource, getFpaSummary } from "@/lib/data/strategy-data";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    horizonQuarters?: number;
    params?: Partial<SimParams>;
    mode?: "discrete" | "dynamics";
  };

  const params: SimParams = { ...DEFAULT_SIM_PARAMS, ...body.params };
  const horizon = body.horizonQuarters ?? 8;
  const mode = body.mode ?? "dynamics";

  // Seed the simulation from the live (DB-backed) FPA position, not constants.
  const [fpa, source] = await Promise.all([getFpaSummary(), getDataSource()]);

  const trail =
    mode === "dynamics"
      ? runStratSimDynamics(horizon, params, deriveDynamicsInitial(fpa, DEFAULT_DYNAMICS_INITIAL))
      : runStratSim(horizon, params, deriveSimSeed(fpa));

  return NextResponse.json({
    trail,
    warnings: simWarnings(trail),
    mode,
    source,
  });
}
