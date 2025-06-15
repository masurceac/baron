import { GetRouteParams } from '@/core/route';
import { PageLayout } from '@/modules/shared';
import { useParams } from 'react-router-dom';
import { LiveTradingDetails } from '../components/live-trading-details';

export function LiveTradingRoomViewPage() {
  const params =
    useParams<GetRouteParams<'/app/live-trading/view/:liveTradingRoomId'>>();

  if (!params.liveTradingRoomId) {
    return <div>Invalid ID</div>;
  }

  return (
    <PageLayout title="Live Trading Room Details">
      <LiveTradingDetails liveTradingRoomId={params.liveTradingRoomId} />
    </PageLayout>
  );
}
