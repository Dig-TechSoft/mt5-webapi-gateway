import { Mt5Client } from '../../../../mt5/Mt5Client';
import { PositionInfo, PositionInfoBatchParams } from '../../types/position.types';

export class PositionService {
    constructor(private mt5: Mt5Client) {}

    async getPosition(login: number, symbol: string): Promise<PositionInfo> {
        return await this.mt5.getPosition(login, symbol);
    }

    async getPositionBatch(params: PositionInfoBatchParams): Promise<PositionInfo[]> {
        const { login, symbol } = params;
        return await this.mt5.getPositionBatch(Number(login) ?? 0, symbol ?? '');
    }
}
