import { getEmitters } from '@baron/ws/core';
import { TradeClientServerWebsocketEvents, tradeClientWebsockets } from '@baron/ws/trade-client-ws';
import { createWebSocketServer } from '@baron/ws/server';
import { DurableObject } from 'cloudflare:workers';

const serverWs = createWebSocketServer(tradeClientWebsockets);

type ServerType = ReturnType<(typeof serverWs)['init']>['server'];

export class TradeRoomDurableObject extends DurableObject {
	public currentlyConnectedWebSockets: number;
	private connections: Set<ServerType>;
	private state: DurableObjectState;

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);

		this.state = state;

		this.currentlyConnectedWebSockets = 0;
		this.connections = new Set();

		this.state.getWebSockets().forEach((ws) => {
			this.connections.add(ws);
			this.currentlyConnectedWebSockets += 1;
		});
	}

	override async fetch() {
		const wsInstance = serverWs.init();

		this.connections.add(wsInstance.server);
		this.currentlyConnectedWebSockets += 1;

		this.ctx.acceptWebSocket(wsInstance.server);

		return new Response(null, {
			status: 101,
			webSocket: wsInstance.client,
		});
	}

	async emitEnterTradeEvent(payload: TradeClientServerWebsocketEvents['enterTrade']) {
		for (const wsServer of this.connections.values()) {
			const emitters = getEmitters(tradeClientWebsockets.server, wsServer);
			emitters.enterTrade(payload);
		}
	}

	override async webSocketClose(ws: WebSocket, code: number): Promise<void> {
		this.currentlyConnectedWebSockets -= 1;
		ws.close(code, 'Durable Object is closing WebSocket');
		console.log('Closed. Connections left: ' + this.currentlyConnectedWebSockets);
		this.connections.delete(ws);
	}
}
