import { Mt5Client } from '../../mt5/Mt5Client';
import { Mt5Response } from '../../mt5/types/common';
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

    async checkPassword(login: number, password: string, type: PasswordType): Promise<Mt5Response<any>> {
        return await this.mt5.checkPassword(login, password, type);
    }

    async changePassword(params: UserChangePasswordParams): Promise<void> {
        return await this.mt5.changePassword(params);
    }

    async getUserGroup(login: number): Promise<string> {
        return await this.mt5.getUserGroup(login);
    }

    async getUserGroupRaw(login: number): Promise<Mt5Response<{ Group: string }>> {
        return await this.mt5.getUserGroupRaw(login);
    }

    async getUserTotal(): Promise<number> {
        return await this.mt5.getUserTotal();
    }

    async getUserTotalRaw(): Promise<Mt5Response<{ Total: string }>> {
        return await this.mt5.getUserTotalRaw();
    }

    async getUserAccount(login: number): Promise<any> {
        return await this.mt5.getUserAccount(login);
    }

    async getUserAccountRaw(login: number): Promise<Mt5Response<any>> {
        return await this.mt5.getUserAccountRaw(login);
    }

    async getUserLogins(groups: string[]): Promise<number[]> {
        return await this.mt5.getUserLogins(groups);
    }

    async getUserLoginsRaw(groups: string[]): Promise<Mt5Response<string[]>> {
        return await this.mt5.getUserLoginsRaw(groups);
    }

    async getUserCertificate(login: number): Promise<string[]> {
        return await this.mt5.getUserCertificate(login);
    }

    async getUserCertificateRaw(login: number): Promise<Mt5Response<string[]>> {
        return await this.mt5.getUserCertificateRaw(login);
    }

    async getUserOtpSecret(login: number): Promise<string> {
        return await this.mt5.getUserOtpSecret(login);
    }

    async getUserOtpSecretRaw(login: number): Promise<Mt5Response<{ OTP_SECRET: string }>> {
        return await this.mt5.getUserOtpSecretRaw(login);
    }

    async getUserCheckBalance(login: number, fixflag?: number): Promise<{ Balance?: any; Credit?: any }> {
        return await this.mt5.getUserCheckBalance(login, fixflag);
    }

    async getUserCheckBalanceRaw(login: number, fixflag?: number): Promise<Mt5Response<{ Balance?: any; Credit?: any }>> {
        return await this.mt5.getUserCheckBalanceRaw(login, fixflag);
    }
}
