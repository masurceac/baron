import { createWebSocketAPI, getEmitters, setupListeners } from '../core';

export function createWebSocketServer<
  T extends ReturnType<typeof createWebSocketAPI>,
>(wsApi: T) {
  return {
    init: () => {
      const ws = new WebSocketPair();
      const { 0: client, 1: server } = ws;

      return {
        client,
        server,
        setupListeners: setupListeners<T['client']>(wsApi.client, server),
        emitters: getEmitters<T['server']>(wsApi.server, server),
      };
    },
  };
}
