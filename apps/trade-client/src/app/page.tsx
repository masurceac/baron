import { ModuleSelector } from '@/modules/module-selector';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export default function Home() {
  const c = getCloudflareContext();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8">
      <ModuleSelector wsUrl={c.env.NEXT_PUBLIC_LIVE_TRADE_WS_URL} />
    </div>
  );
}
