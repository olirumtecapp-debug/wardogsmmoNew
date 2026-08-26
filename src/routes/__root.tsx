import { MuriloMasterAdmin } from "@/components/MuriloMasterAdmin";
import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { trackPageView } from "../lib/tracking";
import { ScenarioProvider } from "../game/scenarioContext";
import { Toaster } from "@/components/ui/sonner";
import { useDevShortcuts } from "@/hooks/useDevShortcuts";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground stencil">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Alvo não localizado</h2>
        <p className="mt-2 text-sm text-muted-foreground">Esta posição não existe no mapa.</p>
        <div className="mt-6">
          <Link to="/" className="btn-hud btn-primary">Voltar à base</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground stencil">Falha no combate</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo deu errado. Tente recarregar a missão.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="btn-hud btn-primary"
          >Reiniciar</button>
          <a href="/" className="btn-hud">Base</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  useDevShortcuts();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return (
    <ScenarioProvider>
      <Outlet />
      <MuriloMasterAdmin />
      <Toaster />
    </ScenarioProvider>
  );
}
