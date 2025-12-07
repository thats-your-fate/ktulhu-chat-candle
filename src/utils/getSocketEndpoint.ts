/**
 * Returns the WebSocket endpoint for all front-end connections.
 */

export function getSocketEndpoint(): string {
  return "ws://localhost:3000/ws";
}

/** Convert http/https → ws/wss */
function normalizeToWs(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "ws://");
  if (url.startsWith("https://")) return url.replace("https://", "wss://");
  return url.startsWith("ws") ? url : `wss://${url}`;
}
