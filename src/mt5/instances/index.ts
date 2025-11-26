import { Mt5Client } from '../Mt5Client';
import { brokers } from '../../config/brokers';

const clients: Map<string, Mt5Client> = new Map();

Object.values(brokers).forEach(config => {
    clients.set(config.id, new Mt5Client(config));
});

export const getMt5Client = (brokerId?: string): Mt5Client => {
    if (brokerId) {
        const client = clients.get(brokerId);
        if (!client) throw new Error(`Broker ${brokerId} not configured`);
        return client;
    }

    // No brokerId provided — return the first configured client as the default
    const first = clients.values().next();
    if (first.done || !first.value) {
        throw new Error('No brokers configured');
    }
    return first.value;
};
