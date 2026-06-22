import { NextResponse } from "next/server";
import { requireRouteAccess } from "@/lib/auth/guard";
import { getPermissionConfig, setPermissionConfig, type PermissionConfig } from "@/lib/auth/permission-config";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireRouteAccess("/admin/access");
  return NextResponse.json(getPermissionConfig());
}

export async function POST(request: Request) {
  await requireRouteAccess("/admin/access");
  const body = (await request.json()) as Partial<PermissionConfig>;
  const current = getPermissionConfig();
  const next: PermissionConfig = {
    openMode: typeof body.openMode === "boolean" ? body.openMode : current.openMode,
    adminRoles: current.adminRoles,
    executiveRoles: current.executiveRoles,
  };
  setPermissionConfig(next);
  return NextResponse.json(next);
}
