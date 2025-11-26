import { Mt5Client } from '../Mt5Client';
import { brokers } from '../../config/brokers';

const clients: Map<string, Mt5Client> = new Map();

Object.values(brokers).forEach(config => {
    clients.set(config.id, new Mt5Client(config));
});

export const getMt5Client = (brokerId: string): Mt5Client => {
    const client = clients.get(brokerId);
    if (!client) throw new Error(`Broker ${brokerId} not configured`);
    return client;
};
