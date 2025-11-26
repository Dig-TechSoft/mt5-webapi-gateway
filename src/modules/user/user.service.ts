import { Mt5Client } from '../../mt5/Mt5Client';
import { UserInfo, UserAddParams, UserUpdateParams, UserChangePasswordParams, PasswordType } from './types/user.types';

export class UserService {
    constructor(private mt5: Mt5Client) { }

    async getUser(login: number): Promise<UserInfo> {
        return await this.mt5.getUser(login);
    }

    async getUserBatch(params: { login?: number[]; group?: string[] }): Promise<UserInfo[]> {
        return this.mt5.getUserBatch(params);
    }

    async addUser(params: UserAddParams): Promise<UserInfo> {
        return await this.mt5.addUser(params);
    }

    async updateUser(params: UserUpdateParams): Promise<UserInfo> {
        return await this.mt5.updateUser(params);
    }

    async deleteUser(login: number): Promise<void> {
        return await this.mt5.deleteUser(login);
    }

    async checkPassword(login: number, password: string, type: PasswordType): Promise<void> {
        return await this.mt5.checkPassword(login, password, type);
    }

    async changePassword(params: UserChangePasswordParams): Promise<void> {
        return await this.mt5.changePassword(params);
    }
}
