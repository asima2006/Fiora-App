import fs from 'fs';
import path from 'path';
import axios from 'axios';
import assert, { AssertionError } from 'assert';
import { promisify } from 'util';
import RegexEscape from 'regex-escape';
import OSS, { STS } from 'ali-oss';

import config from '@fiora/config/server';
import logger from '@fiora/utils/logger';
import User from '@fiora/database/mongoose/models/user';
import Group from '@fiora/database/mongoose/models/group';

import Socket from '@fiora/database/mongoose/models/socket';
import {
    getAllSealIp,
    getAllSealUser,
    getSealIpKey,
    getSealUserKey,
    DisableSendMessageKey,
    DisableNewUserSendMessageKey,
    Redis,
} from '@fiora/database/redis/initRedis';

/** Baidu language synthesis token */
let baiduToken = '';
/** Last time token was obtained */
let lastBaiduTokenTime = Date.now();

/**
 * Search users and groups
 * @param ctx Context
 */
export async function search(ctx: Context<{ keywords: string }>) {
    const keywords = ctx.data.keywords?.trim() || '';
    if (keywords === '') {
        return {
            users: [],
            groups: [],
        };
    }

    const escapedKeywords = RegexEscape(keywords);
    const users = await User.find(
        { username: { $regex: escapedKeywords } },
        { avatar: 1, username: 1 },
    );
    const groups = await Group.find(
        { name: { $regex: escapedKeywords } },
        { avatar: 1, name: 1, members: 1 },
    );

    return {
        users,
        groups: groups.map((group) => ({
            _id: group._id,
            avatar: group.avatar,
            name: group.name,
            members: group.members.length,
        })),
    };
}

/**
 * Search emoji pack, crawl other site resources
 * @param ctx Context
 */
export async function searchExpression(
    ctx: Context<{ keywords: string; limit?: number }>,
) {
    const { keywords, limit = Infinity } = ctx.data;
    if (keywords === '') {
        return [];
    }

    const res = await axios({
        method: 'get',
        url: `https://pic.sogou.com/pics/json.jsp?query=${encodeURIComponent(
            `${keywords} emoji`,
        )}&st=5&start=0&xml_len=60&callback=callback&reqFrom=wap_result&`,
        headers: {
            accept: '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
            'cache-control': 'no-cache',
            pragma: 'no-cache',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-origin',
            referrer: `https://pic.sogou.com/pic/emo/searchList.jsp?statref=search_form&uID=hTHHybkSPt37C46z&spver=0&rcer=&keyword=${encodeURIComponent(
                keywords,
            )}`,
            referrerPolicy: 'no-referrer-when-downgrade',
            'user-agent':
                'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        },
    });
    assert(res.status === 200, 'Failed to search emoji pack, please retry');

    try {
        const parseDataResult = res.data.match(/callback\((.+)\)/);
        const data = JSON.parse(`${parseDataResult[1]}`);

        type Image = {
            locImageLink: string;
            width: number;
            height: number;
        };
        const images = data.items as Image[];
        return images
            .map(({ locImageLink, width, height }) => ({
                image: locImageLink,
                width,
                height,
            }))
            .filter((image, index) =>
                limit === Infinity ? true : index < limit,
            );
    } catch (err) {
        assert(false, 'Failed to search emoji pack, data parsing error');
    }

    return [];
}

/**
 * Get Baidu language synthesis token
 */
export async function getBaiduToken() {
    if (baiduToken && Date.now() < lastBaiduTokenTime) {
        return { token: baiduToken };
    }

    const res = await axios.get(
        'https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=pw152BzvaSZVwrUf3Z2OHXM6&client_secret=fa273cc704b080e85ad61719abbf7794',
    );
    assert(res.status === 200, 'Failed to request Baidu token');

    baiduToken = res.data.access_token;
    lastBaiduTokenTime =
        Date.now() + (res.data.expires_in - 60 * 60 * 24) * 1000;
    return { token: baiduToken };
}

/**
 * Ban user, requires administrator permission
 * @param ctx Context
 */
export async function sealUser(ctx: Context<{ username: string }>) {
    const { username } = ctx.data;
    assert(username !== '', 'Username cannot be empty');

    const user = await User.findOne({ username });
    if (!user) {
        throw new AssertionError({ message: 'User does not exist' });
    }

    const userId = user._id.toString();
    const isSealUser = await Redis.has(getSealUserKey(userId));
    assert(!isSealUser, 'User is already in ban list');

    await Redis.set(getSealUserKey(userId), userId, Redis.Minute * 10);

    return {
        msg: 'ok',
    };
}

/**
 * Get ban list, including user ban and IP ban, requires administrator permission
 */
export async function getSealList() {
    const sealUserList = await getAllSealUser();
    const sealIpList = await getAllSealIp();
    const users = await User.find({ _id: { $in: sealUserList } });

    const result = {
        users: users.map((user) => user.username),
        ips: sealIpList,
    };
    return result;
}

const CantSealLocalIp = 'Cannot ban local network IP';
const CantSealSelf = 'Why ban yourself';
const IpInSealList = 'IP is already in ban list';

/**
 * Ban IP address, requires administrator permission
 */
export async function sealIp(ctx: Context<{ ip: string }>) {
    const { ip } = ctx.data;
    assert(ip !== '::1' && ip !== '127.0.0.1', CantSealLocalIp);
    assert(ip !== ctx.socket.ip, CantSealSelf);

    const isSealIp = await Redis.has(getSealIpKey(ip));
    assert(!isSealIp, IpInSealList);

    await Redis.set(getSealIpKey(ip), ip, Redis.Hour * 6);

    return {
        msg: 'ok',
    };
}

/**
 * Ban all online IP addresses of specified user, requires administrator permission
 */
export async function sealUserOnlineIp(ctx: Context<{ userId: string }>) {
    const { userId } = ctx.data;

    const user = await User.findOne({ _id: userId });
    assert(user, 'User does not exist');
    const sockets = await Socket.find({ user: userId });
    const ipList = [
        ...sockets.map((socket) => socket.ip),
        user.lastLoginIp,
    ].filter(
        (ip) =>
            ip !== '' &&
            ip !== '::1' &&
            ip !== '127.0.0.1' &&
            ip !== ctx.socket.ip,
    );

    // If all IPs have been banned, prompt directly
    const isSealIpList = await Promise.all(
        ipList.map((ip) => Redis.has(getSealIpKey(ip))),
    );
    assert(!isSealIpList.every((isSealIp) => isSealIp), IpInSealList);

    await Promise.all(
        ipList.map(async (ip) => {
            await Redis.set(getSealIpKey(ip), ip, Redis.Hour * 6);
        }),
    );

    return {
        msg: 'ok',
    };
}

type STSResult = {
    enable: boolean;
    AccessKeyId: string;
    AccessKeySecret: string;
    bucket: string;
    region: string;
    SecurityToken: string;
    endpoint: string;
};

// eslint-disable-next-line consistent-return
export async function getSTS(): Promise<STSResult> {
    if (!config.aliyunOSS.enable) {
        // @ts-ignore
        return {
            enable: false,
        };
    }

    const sts = new STS({
        accessKeyId: config.aliyunOSS.accessKeyId,
        accessKeySecret: config.aliyunOSS.accessKeySecret,
    });
    try {
        const result = await sts.assumeRole(
            config.aliyunOSS.roleArn,
            undefined,
            undefined,
            'fiora-uploader',
        );
        // @ts-ignore
        return {
            enable: true,
            region: config.aliyunOSS.region,
            bucket: config.aliyunOSS.bucket,
            endpoint: config.aliyunOSS.endpoint,
            ...result.credentials,
        };
    } catch (err) {
        const typedErr = err as Error;
        assert.fail(`Failed to get STS - ${typedErr.message}`);
    }
}

export async function uploadFile(
    ctx: Context<{ fileName: string; file: any; isBase64?: boolean }>,
) {
    try {
        if (config.aliyunOSS.enable) {
            const sts = await getSTS();
            const client = new OSS({
                accessKeyId: sts.AccessKeyId,
                accessKeySecret: sts.AccessKeySecret,
                bucket: sts.bucket,
                region: sts.region,
                stsToken: sts.SecurityToken,
            });
            const result = await client.put(
                ctx.data.fileName,
                ctx.data.isBase64
                    ? Buffer.from(ctx.data.file, 'base64')
                    : ctx.data.file,
            );
            if (result.res.status === 200) {
                return {
                    url: `//${config.aliyunOSS.endpoint}/${result.name}`,
                };
            }
            throw Error('Failed to upload to Alibaba Cloud OSS');
        }

        const [directory, fileName] = ctx.data.fileName.split('/');
        
        // Build path: In dev mode __dirname is .../packages/server/src
        // In production __dirname is .../packages/server/dist
        // public folder is always at .../packages/server/public
        // So we need to go up to the server package root first
        const serverRoot = __dirname.includes('src') 
            ? path.resolve(__dirname, '..', '..')  // From src, go up 2 levels
            : path.resolve(__dirname, '..');        // From dist, go up 1 level
        const publicDir = path.join(serverRoot, 'public');
        const filePath = path.join(publicDir, directory);
        
        logger.info('[uploadFile] Directory:', directory);
        logger.info('[uploadFile] FileName:', fileName);
        logger.info('[uploadFile] Public Dir:', publicDir);
        logger.info('[uploadFile] File Path:', filePath);
        
        const isExists = await promisify(fs.exists)(filePath);
        if (!isExists) {
            logger.info('[uploadFile] Creating directory:', filePath);
            await promisify(fs.mkdir)(filePath, { recursive: true });
        }
        
        // Convert array buffer to Buffer
        const buffer = Array.isArray(ctx.data.file)
            ? Buffer.from(ctx.data.file)
            : ctx.data.file;
        
        const fullPath = path.resolve(filePath, fileName);
        logger.info('[uploadFile] Writing file to:', fullPath);
        logger.info('[uploadFile] Buffer size:', buffer.length);
        
        await promisify(fs.writeFile)(
            fullPath,
            buffer,
        );
        
        logger.info('[uploadFile] File written successfully');
        
        return {
            url: `/${ctx.data.fileName}`,
        };
    } catch (err) {
        const typedErr = err as Error;
        logger.error('[uploadFile]', typedErr.message);
        return `Failed to upload file:${typedErr.message}`;
    }
}

export async function toggleSendMessage(ctx: Context<{ enable: boolean }>) {
    const { enable } = ctx.data;
    await Redis.set(DisableSendMessageKey, (!enable).toString());
    return {
        msg: 'ok',
    };
}

export async function toggleNewUserSendMessage(
    ctx: Context<{ enable: boolean }>,
) {
    const { enable } = ctx.data;
    await Redis.set(DisableNewUserSendMessageKey, (!enable).toString());
    return {
        msg: 'ok',
    };
}

export async function getSystemConfig() {
    return {
        disableSendMessage: (await Redis.get(DisableSendMessageKey)) === 'true',
        disableNewUserSendMessage:
            (await Redis.get(DisableNewUserSendMessageKey)) === 'true',
    };
}
