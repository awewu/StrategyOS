import { NextResponse } from "next/server";
import { requireRouteAccess } from "@/lib/auth/guard";
import {
  loadPermissionConfigFromDb,
  savePermissionConfigToDb,
  type PermissionConfig,
} from "@/lib/auth/permission-config";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireRouteAccess("/admin/access");
  const config = await loadPermissionConfigFromDb();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  await requireRouteAccess("/admin/access");
  const body = (await request.json()) as Partial<PermissionConfig>;
  const current = await loadPermissionConfigFromDb();
  const next: PermissionConfig = {
    openMode: typeof body.openMode === "boolean" ? body.openMode : current.openMode,
    adminRoles: current.adminRoles,
    executiveRoles: current.executiveRoles,
  };
  await savePermissionConfigToDb(next);
  return NextResponse.json(next);
}
