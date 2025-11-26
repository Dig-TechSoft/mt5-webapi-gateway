export interface OrderInfo {
	Order?: string;
	ExternalID?: string;
	Login?: string;
	Dealer?: string;
	Symbol?: string;
	Digits?: string | number;
	DigitsCurrency?: string | number;
	ContractSize?: string;
	State?: string | number;
	Reason?: string | number;
	[key: string]: any;
}

export type OrderInfoBatchParams = {
	ticket?: number[];
};
