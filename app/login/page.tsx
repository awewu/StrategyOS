import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { authRequired, demoLoginAllowed, workosConfigured } from "@/lib/auth/config";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-deep)] px-6 py-12">
      <Suspense fallback={<div className="text-sm text-[var(--color-text-muted)]">加载…</div>}>
        <LoginForm
          workosReady={workosConfigured()}
          demoLoginAllowed={demoLoginAllowed()}
          requireAuth={authRequired()}
        />
      </Suspense>
    </div>
  );
}
