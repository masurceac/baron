import { z, ZodTypeAny } from 'zod';

type EventListener = ReturnType<
  ReturnType<typeof createEvent>['createHandler']
>;

export function createEvent<
  Key extends Readonly<string>,
  TSchema extends ZodTypeAny,
>(key: Key, schema: TSchema) {
  return {
    createHandler: (
      handler: (ctx: { payload: z.infer<TSchema> }) => Promise<void> | void,
    ) => {
      return {
        schema,
        handler,
        key,
      };
    },
  };
}

export function createEventBus<TListeners extends EventListener[]>(
  listeners: TListeners,
) {
  return {
    async dispatch<TEvent extends TListeners[number]['key']>(
      event: TEvent,
      payload: z.infer<Extract<TListeners[number], { key: TEvent }>['schema']>,
    ) {
      for (const listener of listeners) {
        if (listener.key === event) {
          const parsedPayload = listener.schema.safeParse(payload);
          if (parsedPayload.success) {
            try {
              await listener.handler({ payload: parsedPayload.data });
            } catch (err) {
              console.error('Event bus handler failed ' + listener.key);
              console.error(err);
            }
          }
        }
      }
    },
  };
}
