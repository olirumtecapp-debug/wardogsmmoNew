import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Broadcast payloads used during a match
export type NetEvent =
  | { t: "input"; slot: number; action: InputAction }
  | { t: "snapshot"; state: unknown }
  | { t: "explosion"; x: number; y: number; r: number }
  | { t: "turn"; slot: number; wind: number }
  | { t: "chat"; slot: number; text: string };

export type InputAction =
  | { k: "angle"; v: number }
  | { k: "power"; v: number }
  | { k: "weapon"; v: string }
  | { k: "move"; dir: -1 | 1; dt: number }
  | { k: "jump" }
  | { k: "fire" };

export interface MatchChannel {
  channel: RealtimeChannel;
  send(ev: NetEvent): Promise<void>;
  close(): Promise<void>;
}

export function openMatchChannel(matchId: string, userId: string, onEvent: (ev: NetEvent, from: string) => void): MatchChannel {
  const channel = supabase.channel(`match:${matchId}`, {
    config: { broadcast: { self: false, ack: false }, presence: { key: userId } },
  });

  channel.on("broadcast", { event: "net" }, (payload) => {
    const ev = payload.payload as NetEvent;
    const from = (payload as { from?: string }).from ?? "";
    onEvent(ev, from);
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({ user_id: userId, at: Date.now() });
    }
  });

  return {
    channel,
    async send(ev: NetEvent) {
      await channel.send({ type: "broadcast", event: "net", payload: ev });
    },
    async close() {
      try { await channel.untrack(); } catch { /* ignore */ }
      await supabase.removeChannel(channel);
    },
  };
}
