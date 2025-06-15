'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createWebSocketAPI, getEmitters, setupListeners } from '../core';

type InitWSOptions<T extends ReturnType<typeof createWebSocketAPI>> = {
  url: string;
  onOpen?: (options: {
    socket: WebSocket;
    emitters: ReturnType<typeof getEmitters<T['client']>>;
  }) => void;
  onClose?: () => void;
} & (
  | {
      shouldReconnect: false;
    }
  | {
      shouldReconnect: true;
      reconnectIntervalMs: number;
    }
);

const WS_DISCONNECT_CODE = 1000;

export function useWebsocketClient<
  T extends ReturnType<typeof createWebSocketAPI>,
>(client: T, options: InitWSOptions<T>) {
  const clientRef = useRef(client);
  const optionsRef = useRef(options);
  const [ws, setWs] = useState<WebSocket>();
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const manuallyDisconnectedRef = useRef(false);

  const connectWs = useCallback(() => {
    const socket = new WebSocket(optionsRef.current.url);

    let forcedToDisconnect = false;

    socket.onopen = () => {
      console.log('Connected');
      optionsRef.current.onOpen?.({
        socket,
        emitters: getEmitters<T['client']>(clientRef.current.client, socket),
      });
    };

    socket.onclose = () => {
      if (forcedToDisconnect) {
        console.log('Forcely disconnected');

        return;
      }

      if (
        !manuallyDisconnectedRef.current &&
        optionsRef.current.shouldReconnect &&
        !reconnectTimeout.current
      ) {
        reconnectTimeout.current = setTimeout(() => {
          reconnectTimeout.current = undefined;
          console.log('Attempting to reconnect');
          connectWs();
        }, optionsRef.current.reconnectIntervalMs);
        console.log('Reconnecting...');
      } else {
        console.log('Disconnected');
      }
    };

    setWs(socket);

    return () => {
      console.log('WS Component Unmounted');
      forcedToDisconnect = true;
      socket.close(WS_DISCONNECT_CODE);
    };
  }, []);

  const disconnect = useCallback(() => {
    manuallyDisconnectedRef.current = true;
    ws?.close(WS_DISCONNECT_CODE);
    setWs(undefined);
  }, [ws]);

  useEffect(() => {
    const cleanup = connectWs();

    return () => {
      cleanup();
    };
  }, [connectWs]);

  const listeners = useMemo(
    () =>
      ws ? setupListeners<T['server']>(clientRef.current.server, ws) : null,
    [ws],
  );

  const emitters = useMemo(
    () => (ws ? getEmitters<T['client']>(clientRef.current.client, ws) : null),
    [ws],
  );

  if (!ws || !emitters || !listeners) {
    return {
      loading: true,
    } as const;
  }

  return {
    socket: ws,
    disconnect,
    setupListeners: listeners,
    emitters: emitters,
  };
}
