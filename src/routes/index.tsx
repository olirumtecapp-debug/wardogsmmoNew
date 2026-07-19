import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WarDogsGame } from "@/components/WarDogsGame";
import { OrientationGate } from "@/components/OrientationGate";
import type { GameMode } from "@/game/types";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [showOnlineNotice, setShowOnlineNotice] = useState(false);

  if (mode) {
    return (
      <OrientationGate>
        <div className="fixed inset-0">
          <WarDogsGame mode={mode} onExit={() => setMode(null)} />
        </div>
      </OrientationGate>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--team-green)" }}>
            <span className="stencil text-lg text-primary-foreground">W</span>
          </div>
          <div>
            <div className="stencil text-xl leading-none">WarDogs</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Artilharia canina</div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <div className="max-w-2xl w-full text-center">
          <h1 className="stencil text-5xl sm:text-7xl leading-none">
            <span style={{ color: "var(--team-green)" }}>WAR</span>
            <span style={{ color: "var(--team-red)" }}>DOGS</span>
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Cachorros marrentos de capacete militar. Bazuca, granada e AK. Terreno destrutível.
            <br className="hidden sm:block" /> Escolha o ângulo. Calcule o vento. Detone o adversário.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <ModeCard
              title="vs IA"
              subtitle="Contra o computador"
              color="var(--team-green)"
              onClick={() => setMode("ai")}
            />
            <ModeCard
              title="Hotseat"
              subtitle="2 jogadores, mesmo dispositivo"
              color="var(--accent)"
              onClick={() => setMode("hotseat")}
            />
            <ModeCard
              title="Online"
              subtitle="Em breve"
              color="var(--team-red)"
              disabled
              onClick={() => setShowOnlineNotice(true)}
            />
          </div>

          {showOnlineNotice && (
            <div className="mt-6 panel p-4 text-sm text-left">
              <div className="stencil text-xs uppercase text-warn mb-1">Multiplayer online</div>
              O modo online por código de sala exige infraestrutura WebSocket persistente (Durable Objects na Cloudflare).
              O jogo base — física, terreno, IA e hotseat — já está funcionando. Peça pra ativar o online quando quiser que eu
              provisione o backend WebSocket.
              <button className="btn-hud mt-3 text-xs" onClick={() => setShowOnlineNotice(false)}>Fechar</button>
            </div>
          )}

          <div className="mt-10 text-xs text-muted-foreground grid gap-1 max-w-md mx-auto">
            <div><kbd className="px-1.5 py-0.5 bg-secondary rounded">← →</kbd> ângulo · <kbd className="px-1.5 py-0.5 bg-secondary rounded">↑ ↓</kbd> força · <kbd className="px-1.5 py-0.5 bg-secondary rounded">Espaço</kbd> atirar · <kbd className="px-1.5 py-0.5 bg-secondary rounded">Tab</kbd>/<kbd className="px-1.5 py-0.5 bg-secondary rounded">1–5</kbd> arma</div>
            <div>No celular: arraste a partir do cachorro pra mirar e solte pra atirar.</div>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-muted-foreground">
        Segure firme o capacete. Ajuste o ângulo. Boa sorte, soldado.
      </footer>
    </div>
  );
}

function ModeCard({ title, subtitle, color, onClick, disabled }: { title: string; subtitle: string; color: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`panel p-5 text-left transition hover:-translate-y-0.5 ${disabled ? "opacity-60" : ""}`}
      style={{ borderColor: color }}
    >
      <div className="stencil text-xl" style={{ color }}>{title}</div>
      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{subtitle}</div>
    </button>
  );
}
