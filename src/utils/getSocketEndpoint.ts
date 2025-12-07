/**
 * Returns the WebSocket endpoint for all front-end connections.
 */

export function getSocketEndpoint(): string {
let wsE = import.meta.env.VITE_WEB_SOCK_BASE_URL; 
    return wsE; 
}

