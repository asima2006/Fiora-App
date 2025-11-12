import redis from 'redis';
import { promisify } from 'util';
import config from '@fiora/config/server';
import logger from '@fiora/utils/logger';

export default function initRedis() {
    const client = redis.createClient({
        ...config.redis,
    });

    // If password is provided in config, authenticate after creating client
    if ((config.redis as any).password) {
        try {
            // node_redis exposes auth method
            (client as any).auth((config.redis as any).password, (authErr: Error | null) => {
                if (authErr) {
                    logger.error('[redis] auth failed', authErr.message);
                    process.exit(0);
                }
            });
        } catch (e) {
            // auth may not be necessary or supported; ignore and proceed
        }
    }

    client.on('error', (err: Error) => {
        logger.error('[redis]', err.message);
        process.exit(0);
    });

    return client;
}

const client = initRedis();

export const get = promisify(client.get).bind(client);

export const expire = promisify(client.expire).bind(client);

export async function del(...keys: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
        client.del(keys, (err, reply) => {
            if (err) reject(err);
            else resolve(reply);
        });
    });
}

export async function set(key: string, value: string, expireTime = Infinity) {
    await promisify(client.set).bind(client)(key, value);
    if (expireTime !== Infinity) {
        await expire(key, expireTime);
    }
}

export const keys = promisify(client.keys).bind(client);

export async function has(key: string) {
    const v = await get(key);
    return v !== null;
}

export function getNewUserKey(userId: string) {
    return `NewUser-${userId}`;
}

export function getNewRegisteredUserIpKey(ip: string) {
    // The value of v1 is ip
    // The value of v2 is count number
    return `NewRegisteredUserIpV2-${ip}`;
}

export function getSealIpKey(ip: string) {
    return `SealIp-${ip}`;
}

export async function getAllSealIp() {
    const allSealIpKeys = await keys('SealIp-*');
    return allSealIpKeys.map((key: string) => key.replace('SealIp-', ''));
}

export function getSealUserKey(user: string) {
    return `SealUser-${user}`;
}

export async function getAllSealUser() {
    const allSealUserKeys = await keys('SealUser-*');
    return allSealUserKeys.map((key: string) => key.split('-')[1]);
}

const Minute = 60;
const Hour = Minute * 60;
const Day = Hour * 24;

export const Redis = {
    get,
    set,
    has,
    expire,
    del,
    keys,
    Minute,
    Hour,
    Day,
};

export const DisableSendMessageKey = 'DisableSendMessage';
export const DisableNewUserSendMessageKey = 'DisableNewUserSendMessageKey';
