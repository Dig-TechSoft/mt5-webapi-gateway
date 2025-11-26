export interface BrokerConfig {
    id: string;
    name: string;
    baseUrl: string;
    username?: string;
    password?: string;
    token?: string;
    authType: 'basic' | 'bearer' | 'none';
    timeout?: number;
}

export const brokers: Record<string, BrokerConfig> = {
    uat: {
        id: 'gd-uat',
        name: 'Golday UAT',
        baseUrl: 'https://210.3.149.242:1950',
        username: '1005',
        password: 'Oj-s3gDo',
        authType: 'none', // Auth is handled internally by Mt5Client now
        timeout: 10000
    }
};
