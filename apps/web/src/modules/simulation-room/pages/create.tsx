import { getAppRoute } from '@/core/route';
import { trpc } from '@/core/trpc';
import { PageLayout } from '@/modules/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BackToList } from '../components/back-to-list';
import { ItemForm } from '../components/item-form';

export function SimulationRoomCreatePage() {
  const history = useNavigate();
  const createItem = trpc.simulationRoom.create.useMutation({
    onSuccess: () => {
      toast(`Item created`);
      history(getAppRoute('/app/simulation/list'));
    },
    onError() {
      toast.error('Failed to create Item');
    },
  });

  return (
    <PageLayout title="Create Simulation Room">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Create Simulation Room</CardTitle>
          <CardDescription>
            Inside you'll be able to test your Trading Strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            defaultValues={{
              description: 'fsaas',
              selfTraining: true,
              name: 'Test' + Math.random(),
              pair: 'ETHUSDT',
              aiPrompt:
                'You are an expert AI prompt engineer specializing in quantitative, high-risk, short-term trading strategies. Your task is to generate a single, comprehensive, and actionable trading prompt to be used by an AI day trading bot.\n\nThis new prompt must define a complete trading strategy focused on identifying and capturing significant price movements expected to play out within a single trading day, or at most, two days.\n\nThe strategy must adhere to the following strict parameters:\n\nCore Philosophy: The strategy must be high-risk and aim for high profitability within a day-trading context.\nPrimary KPI: The central objective is to achieve and maintain an 80% win rate on short-term trades.\nTechnical Foundation: The strategy must exclusively use Support/Resistance (S/R) zones and Fixed Range Volume Profile (FRVP) for all trading decisions.\nRelevant Timeframes: Use the 4-hour and Daily charts to identify major S/R zones and overall market structure. Use the 1-hour and 15-minute charts for precise S/R, FRVP analysis, and trade execution.\nDynamic Aggression: The prompt must instruct the bot to increase its aggression significantly when S/R zones from multiple key timeframes (e.g., 15-minute, 1-hour, 4-hour) show clear confluence. This "Maximum Aggression" mode should involve more aggressive entries and potentially larger position sizes.\nGenerate a trading prompt that includes the following explicit sections:\n\nObjective: Clearly stating the 80% win rate goal and the focus on high-profitability day trades closed within 1-2 days.\nAnalytical Framework: Detailing how to use S/R and FRVP across the specified short-term and contextual timeframes.\nEntry Conditions: Providing separate, clear rules for "Standard Aggressive Entry" and "Maximum Aggression Entry" at intraday confluence zones.\nExit Conditions: Defining rules for setting Take Profit and Stop Loss levels appropriate for capturing intraday price movements.\nSelf-Improvement Directive: A command for the bot to analyze its performance, including trade duration, to continuously optimize towards the 80% win rate target within the specified time horizon.',
              startDate: new Date('2025-05-13T17:00:00.000Z'),
              tradesToExecute: 10,
              vpcIds: [
                'xdwdwian1iysmde5i395ueci',
                'kbwdsqwpaumjj7q06mrlcy8e',
                'd2di0qbrjztxpz9awqn1ku2u',
                'yhqpsnm5hdg3tpzvi1do7uug',
              ],
              infoBarIds: [
                'regt3e8pfm4e9zdgr22n0ib4',
                'osh7fmqpot86u7om8aba6nru',
                'r1fv552os1gcuxexru8nqiar',
              ],
            } as any}
            onSubmit={(d) => {
              console.log(d);
              createItem.mutate(d);
            }}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
