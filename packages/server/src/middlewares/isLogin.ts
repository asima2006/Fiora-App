import { Socket } from 'socket.io';

export const PLEASE_LOGIN = 'Please login before trying again';

/**
 * Intercept requests from non-logged-in users to interfaces that require login
 */
export default function isLogin(socket: Socket) {
    const noRequireLoginEvent = new Set([
        'register',
        'login',
        'loginByToken',
        'guest',
        'getDefaultGroupHistoryMessages',
        'getDefaultGroupOnlineMembers',
        'getBaiduToken',
        'getGroupBasicInfo',
        'getCommunityBasicInfo',
        'getSTS',
    ]);
    return async ([event, , cb]: MiddlewareArgs, next: MiddlewareNext) => {
        if (!noRequireLoginEvent.has(event) && !socket.data.user) {
            cb(PLEASE_LOGIN);
        } else {
            next();
        }
    };
}
