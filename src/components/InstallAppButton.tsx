import { useEffect, useState } from "react";
import { Download, X, Copy, Check, Smartphone, Monitor } from "lucide-react";
import { copyText } from "./SupportPixDialog";

const GAME_URL = "https://wardogsmmo.lovable.app";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallAppButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
        setDeferred(null);
        return;
      } catch {
        /* cai no modal de instruções */
      }
    }
    setShowHelp(true);
  };

  return (
    <>
      <button onClick={handleClick} className={className} aria-label="Instalar app">
        <Download size={14} />
        Instalar
      </button>
      {showHelp && <InstallHelpDialog onClose={() => setShowHelp(false)} />}
    </>
  );
}

export function InstallHelpDialog({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    const ok = await copyText(GAME_URL);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="stripe-warn absolute inset-x-0 top-0 h-1.5 opacity-70" aria-hidden />
        <button onClick={onClose} className="btn-hud absolute right-3 top-3 p-1.5" aria-label="Fechar">
          <X size={14} />
        </button>

        <h2 className="stencil text-2xl leading-none text-[color:var(--accent)]">
          JOGUE NO CELULAR E NO PC
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          O WarDogs roda no navegador do celular (de preferência na horizontal) e também em PC ou
          notebook. Dá pra instalar como aplicativo nos dois.
        </p>

        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Endereço do jogo
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="font-mono text-xs break-all text-foreground/90 select-all">
              {GAME_URL}
            </code>
            <button
              onClick={copyUrl}
              className="btn-hud inline-flex items-center gap-2 px-2 py-1 text-[10px] uppercase tracking-[0.2em]"
              aria-label="Copiar endereço do jogo"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[color:var(--team-green)]" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copiar link
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="panel p-3">
            <div className="flex items-center gap-2 text-[color:var(--warn)]">
              <Smartphone size={14} />
              <span className="stencil text-sm">Android</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Chrome → menu ⋮ → <b>Instalar app</b> (ou “Adicionar à tela inicial”).
            </p>
          </div>
          <div className="panel p-3">
            <div className="flex items-center gap-2 text-[color:var(--warn)]">
              <Smartphone size={14} />
              <span className="stencil text-sm">iPhone / iPad</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Safari → botão <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b>.
            </p>
          </div>
          <div className="panel p-3">
            <div className="flex items-center gap-2 text-[color:var(--warn)]">
              <Monitor size={14} />
              <span className="stencil text-sm">PC / Notebook</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Chrome ou Edge → ícone de <b>instalar</b> na barra de endereço → <b>Instalar</b>.
            </p>
          </div>
          <div className="panel p-3">
            <div className="flex items-center gap-2 text-[color:var(--warn)]">
              <Monitor size={14} />
              <span className="stencil text-sm">Controles</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              No PC: mouse e teclado. No celular: toque e arraste — use <b>Tela cheia</b> para
              aproveitar toda a tela.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
