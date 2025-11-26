import { Mt5Client } from '../../../../mt5/Mt5Client';
import { OrderInfo, OrderInfoBatchParams } from '../../types/order.types';

export class OrderService {
	constructor(private mt5: Mt5Client) {}

	async getOrder(ticket: number): Promise<OrderInfo> {
		return await this.mt5.getOrder(ticket);
	}

	async getOrderBatch(params: OrderInfoBatchParams): Promise<OrderInfo[]> {
		const tickets = params.ticket ?? [];
		if (!tickets || tickets.length === 0) return [];
		return await this.mt5.getOrderBatch(tickets);
	}

	async getOrderTotal(login: number): Promise<number> {
		return await this.mt5.getOrderTotal(login);
	}

	async getOrderTotalRaw(login: number): Promise<any> {
		return await this.mt5.getOrderTotalRaw(login);
	}
}

