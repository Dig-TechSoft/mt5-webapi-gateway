export interface PriceQuote {
    Symbol: string;
    Digits?: string | number;
    Datetime?: string | number;
    DatetimeMsc?: string | number;
    Bid?: string | number;
    Ask?: string | number;
    Last?: string | number;
    Volume?: string | number;
    VolumeReal?: string | number;
    [key: string]: any;
}

export interface TickLastParams {
    symbol: string | string[];
    trans_id?: number | string;
}

export interface TickLastResponse {
    trans_id?: string | number;
    answer?: PriceQuote[];
}
