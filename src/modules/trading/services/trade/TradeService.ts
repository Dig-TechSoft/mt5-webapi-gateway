import { Mt5Client } from '../../../../mt5/Mt5Client';
import { TradeBalanceParams, TradeBalanceResponse } from '../../types/trade.types';

export class TradeService {
    constructor(private mt5: Mt5Client) {}

    async balanceOperation(params: TradeBalanceParams): Promise<TradeBalanceResponse> {
        return await this.mt5.tradeBalance(params);
    }
}
