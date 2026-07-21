import { useEffect } from "react";
import { toast } from "sonner";
import { loadUnlocks, setAdminOverride } from "@/lib/unlocks";

/**
 * Atalho de teclado do desenvolvedor:
 * Ctrl+Shift+U (ou Cmd+Shift+U no Mac) → alterna o override que libera
 * todos os personagens elite (Corso, Miu) sem precisar concluir a campanha.
 *
 * Segurança: só afeta o localStorage do próprio navegador — não é auth,
 * é conveniência de teste local. Ninguém consegue tocar em outros jogadores.
 */
export function useDevShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || !e.shiftKey) return;
      if (e.key.toLowerCase() !== "u") return;
      e.preventDefault();
      const current = !!loadUnlocks().adminOverride;
      setAdminOverride(!current);
      if (!current) {
        toast.success("🔓 Modo dev: elites liberados", {
          description: "Corso e Miu disponíveis no briefing.",
        });
      } else {
        toast("🔒 Modo dev: elites bloqueados", {
          description: "Progressão normal restaurada.",
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
