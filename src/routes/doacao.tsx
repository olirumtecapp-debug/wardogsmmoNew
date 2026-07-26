import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Home, Copy, Check } from "lucide-react";
import { useState } from "react";
import { OrientationGate } from "@/components/OrientationGate";
import { MenuBackdrop } from "@/components/MenuBackdrop";
import qrAsset from "@/assets/qrcode-c6.png.asset.json";

export const Route = createFileRoute("/doacao")({
  head: () => ({
    meta: [
      { title: "Doação — WarDogs" },
      {
        name: "description",
        content:
          "Curtiu o WarDogs? Apoie o desenvolvedor com uma doação via Pix e ajude a manter o pelotão em campo.",
      },
      { property: "og:title", content: "Apoie o WarDogs" },
      {
        property: "og:description",
        content:
          "Se você gostou do jogo, considere fazer uma doação via Pix. Toda ajuda faz diferença!",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Apoie o WarDogs" },
      {
        name: "twitter:description",
        content:
          "Se você gostou do jogo, considere fazer uma doação via Pix. Toda ajuda faz diferença!",
      },
    ],
  }),
  component: DoacaoPage,
});

const PIX_PAYLOAD =
  "00020101021126580014br.gov.bcb.pix0136ccc2fd5a-cc51-4626-ac9b-8010315042f55204000053039865802BR5924MURILO FERREIRA DA SILVA6009SAO PAULO622905251KYF6GJBG4K0TVYH7QKHP9TSD63042519";

function DoacaoPage() {
  const [copied, setCopied] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const copyName = async () => {
    try {
      await navigator.clipboard.writeText("Murilo Ferreira da Silva");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_PAYLOAD);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = PIX_PAYLOAD;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  return (
    <OrientationGate soft>
      <div className="relative min-h-dvh overflow-hidden safe-pad">
        {/* Background */}
        <div
          className="fixed inset-0 -z-30"
          style={{
            background:
              "radial-gradient(1200px 800px at 30% 20%, rgba(255,138,26,0.12), transparent 60%), linear-gradient(180deg, #0b0f16 0%, #0a0d12 100%)",
          }}
          aria-hidden
        />
        <div className="fixed inset-0 -z-20 opacity-20 mix-blend-screen pointer-events-none">
          <MenuBackdrop />
        </div>
        <div className="fixed inset-0 -z-10 hero-vignette pointer-events-none" aria-hidden />

        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link
            to="/"
            className="btn-hud inline-flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em]"
          >
            ← Base
          </Link>

          <div className="panel mt-4 p-5 sm:p-7 relative overflow-hidden">
            <div className="stripe-warn absolute inset-x-0 top-0 h-1.5 opacity-70" aria-hidden />
            <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[color:var(--warn)] border border-[color:var(--warn)]/40 bg-[color:var(--warn)]/10 rounded-sm">
              <Heart size={12} className="fill-current" />
              Apoie o projeto
            </div>

            <h1 className="stencil mt-3 text-4xl sm:text-5xl leading-none text-[color:var(--warn)] drop-shadow-[0_0_18px_rgba(255,138,26,0.35)]">
              FAÇA UMA DOAÇÃO
            </h1>

            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Se você curtiu o{" "}
              <span className="text-foreground font-semibold">WarDogs</span> e acha que o pelotão
              merece munição extra, considere fazer uma doação pro desenvolvedor. Qualquer valor
              ajuda a manter o projeto vivo e trazer novas missões, personagens e cenários. 🎯
            </p>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
            <div className="panel mx-auto w-full max-w-[280px] p-3 md:mx-0">
              <div className="rounded-sm bg-white p-3 border border-border/40">
                <img
                  src={qrAsset.url}
                  alt="QR Code Pix C6 Bank — Murilo Ferreira da Silva"
                  className="block h-auto w-full"
                />
              </div>
              <div className="mt-3 text-center stencil text-sm tracking-[0.3em] text-[color:var(--accent)]">
                PIX · APONTE A CÂMERA
              </div>
            </div>

            <div className="panel p-5 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Banco
                </div>
                <div className="stencil text-2xl">C6 Bank</div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Favorecido
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <div className="stencil text-xl sm:text-2xl">
                    Murilo Ferreira da Silva
                  </div>
                  <button
                    onClick={copyName}
                    className="btn-hud p-1.5"
                    title="Copiar nome"
                    aria-label="Copiar nome"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-[color:var(--team-green)]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="mt-1 text-xs italic text-muted-foreground">
                  Motorista &amp; desenvolvedor 🚗💻
                </div>
              </div>

              <div className="border-t border-dashed border-border/50 pt-3 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Pix copia e cola
                </div>
                <button
                  onClick={copyPix}
                  className="btn-hud btn-primary inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-[11px] uppercase tracking-[0.25em]"
                  aria-label="Copiar código Pix copia e cola"
                >
                  {pixCopied ? (
                    <>
                      <Check className="h-4 w-4" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copiar código Pix
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-dashed border-border/50 pt-3">
                <p className="text-sm">
                  💛 Obrigado por chegar até aqui, soldado! Seu apoio faz uma diferença enorme.
                </p>
              </div>

              <Link
                to="/"
                className="btn-hud btn-primary inline-flex items-center gap-2 px-5 py-2 text-[11px] uppercase tracking-[0.25em]"
              >
                <Home className="h-4 w-4" /> Voltar pro jogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </OrientationGate>
  );
}
