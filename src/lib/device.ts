// Detecta se o cliente é PC ou smartphone/tablet.
// Usado para bloquear salas com host de tipo diferente (evita conflitos
// de viewport, mira touch vs. mouse e sincronia de coordenadas).
export type DeviceKind = "desktop" | "mobile";

export function getDeviceKind(): DeviceKind {
  if (typeof window === "undefined") return "desktop";
  try {
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const narrow = window.innerWidth <= 900;
    if (coarse || narrow) return "mobile";
    const ua = navigator.userAgent || "";
    if (/Android|iPhone|iPad|iPod|IEMobile|Mobile/i.test(ua)) return "mobile";
    return "desktop";
  } catch {
    return "desktop";
  }
}

export function deviceLabel(kind: DeviceKind): string {
  return kind === "mobile" ? "Smartphone" : "PC";
}

export class DeviceMismatchError extends Error {
  code = "DEVICE_MISMATCH" as const;
  constructor(public hostDevice: DeviceKind, public localDevice: DeviceKind) {
    super(`Sala criada em ${deviceLabel(hostDevice)}; você está em ${deviceLabel(localDevice)}.`);
    this.name = "DeviceMismatchError";
  }
}
