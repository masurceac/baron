import { getTrpcUrl, trpc } from '@/core/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import Cookies from 'js-cookie';
import { ReactNode, useState } from 'react';
import superjson from 'superjson';

export function TrpcRootProvider(props: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getTrpcUrl(),
          transformer: superjson,
          async headers() {
            return {
              authorization: Cookies.get('__session'),
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
