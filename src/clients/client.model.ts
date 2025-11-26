export interface Client {
    id: string;
    apiKey: string;
    allowedBrokers: string[];
    rateLimit: number;
}
