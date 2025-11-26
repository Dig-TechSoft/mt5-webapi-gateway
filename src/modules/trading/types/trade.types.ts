export type BalanceOperationType = 2 | 3 | 4 | 5 | 6;

export interface TradeBalanceParams {
	login: number;
	type: BalanceOperationType; // 2..6
	balance: number;
	comment?: string;
	check_margin?: number | boolean; // 1 or 0 or true/false
}

export interface TradeBalanceResponse {
	Ticket: string | number;
	[key: string]: any;
}
