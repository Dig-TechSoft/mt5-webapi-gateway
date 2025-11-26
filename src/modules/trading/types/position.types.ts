export interface PositionInfo {
	Position?: string | number;
	ExternalID?: string;
	Login?: string | number;
	Dealer?: string | number;
	Symbol?: string;
	Action?: string | number;
	Digits?: string | number;
	DigitsCurrency?: string | number;
	Reason?: string | number;
	[key: string]: any;
}

export type PositionInfoBatchParams = {
	login?: number;
	symbol?: string;
};
