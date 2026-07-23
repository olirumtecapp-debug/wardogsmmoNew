import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content" },
      { name: "theme-color", content: "#2a331f" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "WarDogs" },
      { title: "WarDogs — Artilharia Canina" },
      { name: "description", content: "Jogo de artilharia por turnos estilo Worms. Ranger e Brutus duelam com bazuca, RPG, arco, cluster e air strike em cenários destrutíveis." },
      { property: "og:title", content: "WarDogs — Artilharia Canina" },
      { property: "og:description", content: "Jogo de artilharia por turnos estilo Worms. Ranger e Brutus duelam com bazuca, RPG, arco, cluster e air strike em cenários destrutíveis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "WarDogs — Artilharia Canina" },
      { name: "twitter:description", content: "Jogo de artilharia por turnos estilo Worms. Ranger e Brutus duelam com bazuca, RPG, arco, cluster e air strike em cenários destrutíveis." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/660f280a-2cb2-442d-819e-12ce19de5213/id-preview-37c46523--17ec0423-0d86-4815-bfd7-dd26c1f5ed41.lovable.app-1784562612054.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/660f280a-2cb2-442d-819e-12ce19de5213/id-preview-37c46523--17ec0423-0d86-4815-bfd7-dd26c1f5ed41.lovable.app-1784562612054.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Chakra+Petch:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&family=Bangers&family=Comic+Neue:wght@700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useDevShortcuts();
  return (
    <QueryClientProvider client={queryClient}>
      <ScenarioProvider>
        <Outlet />
        <Toaster />
      </ScenarioProvider>
    </QueryClientProvider>
  );
}
