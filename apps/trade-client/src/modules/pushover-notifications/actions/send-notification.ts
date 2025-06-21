'use server';

import { TradeClientServerWebsocketEvents } from '@baron/ws/trade-client-ws';
import { PushoverTradeRoomFormSchema } from '../schema';

export async function sendNotification(
  data: TradeClientServerWebsocketEvents['enterTrade'],
  setup: PushoverTradeRoomFormSchema,
): Promise<boolean> {
  try {
    const message = `Trade Signal: ${data.trade.type} ${data.trade.pair}
Stop Loss: ${data.trade.stopLossPrice.toFixed(2)}
Take Profit: ${data.trade.takeProfitPrice.toFixed(2)}
Room: ${setup.name}`;

    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: setup.token,
        user: setup.user,
        message: message,
        title: `Trade Signal - ${data.trade.pair}`,
        priority: 1,
        sound: 'cosmic',
      }),
    });

    if (!response.ok) {
      console.error(
        'Failed to send pushover notification:',
        response.statusText,
      );
      return false;
    }

    console.log('Pushover notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending pushover notification:', error);
    return false;
  }
}
