import { useState } from "react";
import { Heart, Copy, Check, X } from "lucide-react";
import qrAsset from "@/assets/qrcode-c6.png.asset.json";

export const PIX_PAYLOAD =
  "00020101021126580014br.gov.bcb.pix0136ccc2fd5a-cc51-4626-ac9b-8010315042f55204000053039865802BR5924MURILO FERREIRA DA SILVA6009SAO PAULO622905251KYF6GJBG4K0TVYH7QKHP9TSD63042519";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function SupportPixDialog({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyPix = async () => {
    const ok = await copyText(PIX_PAYLOAD);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 4000);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel relative w-full max-w-md max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="stripe-warn absolute inset-x-0 top-0 h-1.5 opacity-70" aria-hidden />
        <button
          onClick={onClose}
          className="btn-hud absolute right-3 top-3 p-1.5"
          aria-label="Fechar"
        >
          <X size={14} />
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[color:var(--warn)] border border-[color:var(--warn)]/40 bg-[color:var(--warn)]/10 rounded-sm">
          <Heart size={12} className="fill-current" />
          Apoiar o projeto
        </div>

        <h2 className="stencil mt-3 text-2xl leading-none text-[color:var(--warn)]">
          APOIE O WARDOGS
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          O jogo é gratuito. Se curtiu, apoie o desenvolvedor com um Pix de qualquer valor — ajuda a
          trazer novas missões, personagens e cenários.
        </p>

        <div className="mt-4 mx-auto w-full max-w-[220px] rounded-sm bg-white p-3 border border-border/40">
          <img
            src={qrAsset.url}
            alt="QR Code Pix C6 Bank — Murilo Ferreira da Silva"
            className="block h-auto w-full"
          />
        </div>
        <div className="mt-2 text-center stencil text-xs tracking-[0.3em] text-[color:var(--accent)]">
          PIX · APONTE A CÂMERA
        </div>

        <div className="mt-4 border-t border-dashed border-border/50 pt-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Banco</div>
          <div className="stencil text-lg">C6 Bank</div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Favorecido
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="stencil text-lg">Murilo Ferreira da Silva</div>
            <button
              onClick={copyPix}
              className="btn-hud inline-flex items-center gap-2 px-2 py-1 text-[10px] uppercase tracking-[0.2em]"
              title="Copiar código Pix copia e cola"
              aria-label="Copiar código Pix copia e cola"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[color:var(--team-green)]" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Pix copia e cola
                </>
              )}
            </button>
          </div>
          {copied && (
            <div className="mt-3 rounded-sm border border-[color:var(--team-green)]/40 bg-[color:var(--team-green)]/10 p-2">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--team-green)] mb-1">
                Código Pix copiado ✓
              </div>
              <div className="font-mono text-[10px] leading-relaxed break-all text-foreground/90 select-all">
                {PIX_PAYLOAD}
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs">
          💛 Obrigado por chegar até aqui, soldado! Só diversão · Sem apostas reais.
        </p>
      </div>
    </div>
  );
}
