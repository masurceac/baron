import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { getOptionalAuth } from '../async-storage/getters';

export async function createInnerContext({ req }: { req: Request | null }) {
  const auth = getOptionalAuth();

  return {
    auth,
    req,
  };
}

export async function createTrpcContext({ req }: { req: Request | null }) {
  const inner = await createInnerContext({ req });
  return inner;
}

export type TPRCContext = Awaited<ReturnType<typeof createInnerContext>>;

const t = initTRPC.context<TPRCContext>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

const isAuthed = t.middleware(async ({ next, ctx }) => {
  if (!ctx.auth) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({ ctx });
});

const hasOrganization = t.middleware(async ({ next, ctx }) => {
  if (!ctx.auth?.orgId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      cause: 'hasOrganization Guard',
    });
  }

  return next({
    ctx: {
      ...ctx,
      orgId: ctx.auth.orgId,
    },
  });
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const organizationProcedure = t.procedure.use(hasOrganization);
export const createCallerFactory = t.createCallerFactory;
