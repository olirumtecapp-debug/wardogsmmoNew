const TRACK_ENDPOINT = "https://projetoij.lovable.app/api/public/track";
const PROJECT_ID = "wardogs";

let lastPath: string | null = null;

export function trackPageView(path: string) {
  if (typeof window === "undefined") return;

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") return;

  if (lastPath === path) return;
  lastPath = path;

  fetch(TRACK_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      project: PROJECT_ID,
      event_type: "page_view",
      path,
    }),
  }).catch(() => {
    // fallback: opaque request when CORS blocks the normal call
    try {
      fetch(TRACK_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project: PROJECT_ID,
          event_type: "page_view",
          path,
        }),
      }).catch(() => {});
    } catch {
      // never break the game because of analytics
    }
  });
}
