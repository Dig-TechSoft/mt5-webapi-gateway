import { Mt5Client } from '../../../../mt5/Mt5Client';
import { OrderInfo, OrderInfoBatchParams } from '../../types/order.types';

export class HistoryOrderService {
	constructor(private mt5: Mt5Client) {}

	async getHistoryOrder(ticket: number): Promise<OrderInfo> {
		return await this.mt5.getHistoryOrder(ticket);
	}

	async getHistoryOrderBatch(params: OrderInfoBatchParams): Promise<OrderInfo[]> {
		const tickets = params.ticket ?? [];
		if (!tickets || tickets.length === 0) return [];
		return await this.mt5.getHistoryOrderBatch(tickets);
	}
}
