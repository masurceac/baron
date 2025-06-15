import { z, ZodSchema } from 'zod';

type MessageHandler<T extends ZodSchema> = (data: z.infer<T>) => void;

export function createWebSocketAPI<
  ClientMessages extends Record<string, { schema: ZodSchema }>,
  ServerMessages extends Record<string, { schema: ZodSchema }>,
>(options: { server: ClientMessages; client: ServerMessages }) {
  return {
    server: options.server,
    client: options.client,
  };
}

export function getEmitters<T extends Record<string, { schema: ZodSchema }>>(
  definitions: T,
  ws: WebSocket,
) {
  type EmitterKeys = keyof T;
  type Emitters = {
    [K in EmitterKeys]: MessageHandler<T[K]['schema']>;
  };

  const emitters = {} as Emitters;

  const emitterKeys = Object.keys(definitions) as EmitterKeys[];
  for (const key of emitterKeys) {
    emitters[key] = (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: key, payload: data }));
      }
    };
  }

  return emitters;
}

export function setupListeners<T extends Record<string, { schema: ZodSchema }>>(
  definitions: T,
  ws: WebSocket,
) {
  type ListenerKeys = keyof T;
  type Listeners = { [K in ListenerKeys]: MessageHandler<T[K]['schema']> };

  return (handlers: Listeners) => {
    ws.addEventListener('message', (event) => {
      bindMessageListeners(definitions, event.data)(handlers);
    });
  };
}

export function bindMessageListeners<
  T extends Record<string, { schema: ZodSchema }>,
>(definitions: T, message: string) {
  type ListenerKeys = keyof T;
  type Listeners = { [K in ListenerKeys]: MessageHandler<T[K]['schema']> };

  return (handlers: Listeners) => {
    const eventSchema = z.object({
      type: z.enum(Object.keys(definitions) as [string, ...string[]]),
      payload: z.any(),
    });

    const listenerKeys = Object.keys(handlers) as ListenerKeys[];
    for (const handler of listenerKeys) {
      const result = eventSchema.safeParse(JSON.parse(message));
      if (result.success && result.data.type === handler) {
        handlers[handler](result.data.payload);
      }
    }
  };
}
