import { Mt5Client } from '../../../../mt5/Mt5Client';
import { PriceQuote, TickLastResponse } from '../../types/price.types';

export class PriceService {
    constructor(private mt5: Mt5Client) { }

    async getTickLast(symbols: string | string[], trans_id?: number | string): Promise<TickLastResponse> {
        return await this.mt5.getTickLast(symbols, trans_id);
    }

    async getTickLastRaw(symbols: string | string[], trans_id?: number | string) {
        return await this.mt5.getTickLastRaw(symbols, trans_id);
    }
}
